import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { UploadService } from '@pdz/core/services/upload.service';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { LeagueZoneService } from '../league-zone.service';
import { LeagueManageService } from '../league-manage/league-manage.service';
import { getLeagueLogoUrl } from '../league.util';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
  CoachEditDialogResult,
} from '../dialogs/coach-edit-dialog/coach-edit-dialog.component';
import {
  TeamEditDialogComponent,
  TeamEditDialogData,
  TeamEditDialogResult,
} from '../dialogs/team-edit-dialog/team-edit-dialog.component';
import {
  SIGNUP_STATUSES,
  SIGNUP_STATUS_LABELS,
  SignUpStatus,
  SignUpValue,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

type Filter = 'all' | SignUpStatus;

const FILTERS: readonly Filter[] = ['all', ...SIGNUP_STATUSES];

@Component({
  selector: 'pdz-applicants-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    DisclosureComponent,
    IconComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './applicants-panel.component.html',
  styleUrl: './applicants-panel.component.scss',
})
export class ApplicantsPanelComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);
  private readonly manage = inject(LeagueManageService);
  private readonly uploads = inject(UploadService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);

  protected readonly busyId = signal<string | null>(null);

  private readonly logoInput =
    viewChild.required<ElementRef<HTMLInputElement>>('logoInput');
  private logoTarget: SignUpValue | null = null;

  protected readonly statuses = SIGNUP_STATUSES;
  protected readonly statusLabels = SIGNUP_STATUS_LABELS;
  protected readonly filters = FILTERS;

  protected readonly filter = signal<Filter>('all');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const entries = this.store.signUps();
    return filter === 'all'
      ? entries
      : entries.filter((entry) => entry.status === filter);
  });

  protected readonly selectedIds = computed(() => [...this.selected()]);

  protected readonly allVisibleSelected = computed(() => {
    const visible = this.visible();
    if (!visible.length) return false;
    const selected = this.selected();
    return visible.every((entry) => selected.has(entry.id));
  });

  protected filterLabel(filter: Filter): string {
    if (filter === 'all') return `All ${this.store.signUps().length}`;
    return `${this.statusLabels[filter]} ${this.store.statusCounts()[filter]}`;
  }

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleAllVisible(): void {
    const visible = this.visible().map((entry) => entry.id);
    this.selected.update((current) => {
      const next = new Set(current);
      const selectAll = !visible.every((id) => next.has(id));
      for (const id of visible) {
        if (selectAll) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  protected setStatus(id: string, status: SignUpStatus): void {
    this.store.setSignUpStatus(id, status);
  }

  protected bulk(status: SignUpStatus): void {
    this.store.setStatusForAll(this.selectedIds(), status);
    this.selected.set(new Set());
  }

  protected teamLink(entry: SignUpValue): string[] | null {
    const leagueSlug = this.league.leagueSlug();
    const tournamentSlug = this.league.tournamentSlug();
    if (!leagueSlug || !tournamentSlug || !entry.teamSlug) return null;
    return [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'teams',
      entry.teamSlug,
    ];
  }

  protected async remove(entry: SignUpValue): Promise<void> {
    const confirmed = await this.dialogs.confirm(`Remove ${entry.teamName}?`, {
      message:
        'This deletes the coach and their team for good. Teams that have already played a match cannot be removed — leave those dropped instead.',
      confirmLabel: 'Remove',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.busyId.set(entry.id);
    this.league
      .removeParticipant(entry.id)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.store.dropSignUp(entry.id);
          this.toast.success(`${entry.teamName} removed.`);
        },
        error: (err) => {
          this.toast.error(
            err?.error?.message ?? 'Could not remove that participant.',
          );
        },
      });
  }

  protected async editCoach(entry: SignUpValue): Promise<void> {
    const result = await this.dialogs.open<
      CoachEditDialogComponent,
      CoachEditDialogResult,
      CoachEditDialogData
    >(CoachEditDialogComponent, {
      heading: 'Edit Coach Info',
      data: {
        name: entry.coach,
        gameName: entry.showdownName,
        discordName: entry.discordName,
        timezone: entry.timezone,
      },
    }).closed;
    if (!result) return;

    this.persist(entry, {
      name: result.name,
      gameName: result.gameName,
      discordName: result.discordName,
      timezone: result.timezone,
    });
  }

  protected async editTeam(entry: SignUpValue): Promise<void> {
    const result = await this.dialogs.open<
      TeamEditDialogComponent,
      TeamEditDialogResult,
      TeamEditDialogData
    >(TeamEditDialogComponent, {
      heading: 'Edit Team Info',
      data: {
        teamName: entry.teamName,
        logoUrl: entry.logo ? getLeagueLogoUrl(entry.logo) : undefined,
      },
    }).closed;
    if (!result) return;

    if (result.teamName !== entry.teamName) {
      this.persist(entry, { teamName: result.teamName });
    }
    if (result.logoFile) this.sendLogo(entry, result.logoFile);
  }

  private persist(
    entry: SignUpValue,
    changes: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
      teamName?: string;
    },
  ): void {
    this.busyId.set(entry.id);
    this.manage
      .updateCoachDetails(entry.id, changes)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.store.patchSignUp(entry.id, changes);
          this.toast.success('Details updated.');
        },
        error: (err) => {
          this.toast.error(
            err?.error?.message ?? 'Could not save those details.',
          );
        },
      });
  }

  protected pickLogo(entry: SignUpValue): void {
    this.logoTarget = entry;
    this.logoInput().nativeElement.click();
  }

  protected uploadLogo(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    const entry = this.logoTarget;
    element.value = '';
    this.logoTarget = null;
    if (!file || !entry) return;
    this.sendLogo(entry, file);
  }

  private sendLogo(entry: SignUpValue, file: File): void {

    this.busyId.set(entry.id);
    let key: string | null = null;

    this.league
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        tap((response) => (key = response.key)),
        switchMap((response) => this.uploads.uploadToS3(response.url, file)),
        switchMap((progress) => {
          if (progress.type === HttpEventType.UploadProgress) return of(null);
          if (progress instanceof HttpResponse && progress.ok && key) {
            return this.league.updateCoachLogo(entry.id, key);
          }
          return of(null);
        }),
        catchError((err) => {
          this.toast.error(err?.error?.message ?? 'Logo upload failed.');
          return of(null);
        }),
        finalize(() => this.busyId.set(null)),
      )
      .subscribe({
        next: (response) => {
          if (!response) return;
          if (key) this.store.patchSignUp(entry.id, { logo: key });
          this.toast.success(`${entry.teamName} logo updated.`);
        },
      });
  }

  protected readiness(entry: SignUpValue): string[] {
    const issues: string[] = [];
    if (!entry.inDiscordServer) issues.push('Not in the Discord server');
    if (entry.status === 'approved' && !entry.hasDiscordRole) {
      issues.push('Missing the coach role');
    }
    return issues;
  }
}
