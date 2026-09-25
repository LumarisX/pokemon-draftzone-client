import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { BadgeComponent } from '@pdz/shared/data/badge/badge.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { apiErrorMessage } from '@pdz/core/services/api.service';
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
  ReplaceCoachDialogComponent,
  ReplaceCoachDialogData,
  ReplaceCoachDialogResult,
} from '../dialogs/replace-coach-dialog/replace-coach-dialog.component';
import {
  DECIDABLE_STATUSES,
  SIGNUP_STATUS_LABELS,
  SignUpAnswerValue,
  SignUpStatus,
  SignUpValue,
  TEAM_STATUSES,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

type ApplicantGroup = {
  id: string;
  label: string;
  hint: string;
  selectable: boolean;
  entries: SignUpValue[];
};

@Component({
  selector: 'pdz-applicants-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BadgeComponent,
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

  protected readonly decidableStatuses = DECIDABLE_STATUSES;
  protected readonly statusLabels = SIGNUP_STATUS_LABELS;

  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  protected readonly subPool = computed(() =>
    this.store
      .signUps()
      .filter(
        (entry) =>
          !entry.teamId &&
          (entry.status === 'approved' || entry.status === 'waitlisted'),
      ),
  );

  protected readonly groups = computed<ApplicantGroup[]>(() => {
    const entries = this.store.signUps();
    return [
      {
        id: 'decide',
        label: 'Needs a decision',
        hint: 'Applied and waiting on you.',
        selectable: true,
        entries: entries.filter((entry) => entry.status === 'pending'),
      },
      {
        id: 'roster',
        label: 'On a roster',
        hint: 'Approved, with a team.',
        selectable: false,
        entries: entries.filter(
          (entry) =>
            !!entry.teamId && entry.status === 'approved' && !entry.departed,
        ),
      },
      {
        id: 'subs',
        label: 'Available to sub',
        hint: 'Approved or waitlisted without a team. Replacements draw from here.',
        selectable: true,
        entries: this.subPool(),
      },
      {
        id: 'out',
        label: 'Not participating',
        hint: 'Denied, dropped, or replaced by another coach.',
        selectable: false,
        entries: entries.filter(
          (entry) =>
            entry.departed ||
            entry.status === 'denied' ||
            entry.status === 'dropped',
        ),
      },
    ];
  });

  protected readonly selectedIds = computed(() => [...this.selected()]);

  protected allSelected(entries: readonly SignUpValue[]): boolean {
    if (!entries.length) return false;
    const selected = this.selected();
    return entries.every((entry) => selected.has(entry.applicationId));
  }

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  protected answerText(answer: SignUpAnswerValue): string {
    const joined = answer.values.join(', ');
    if (joined === 'true') return 'Yes';
    if (joined === 'false') return 'No';
    return joined || '—';
  }

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleAll(entries: readonly SignUpValue[]): void {
    const ids = entries.map((entry) => entry.applicationId);
    this.selected.update((current) => {
      const next = new Set(current);
      const selectAll = !ids.every((id) => next.has(id));
      for (const id of ids) {
        if (selectAll) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  protected statusesFor(entry: SignUpValue): readonly SignUpStatus[] {
    return entry.teamId ? TEAM_STATUSES : DECIDABLE_STATUSES;
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

    const coachId = entry.id;
    if (!coachId) return;
    this.busyId.set(entry.applicationId);
    this.league
      .removeParticipant(coachId)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.store.dropSignUp(entry.applicationId);
          this.toast.success(`${entry.teamName} removed.`);
        },
        error: (err) => {
          this.toast.error(
            apiErrorMessage(err, 'Could not remove that participant.'),
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

    if (result.teamName !== entry.teamName) this.rename(entry, result.teamName);
    if (result.logoFile) this.sendLogo(entry, result.logoFile);
  }

  private rename(entry: SignUpValue, teamName: string): void {
    const teamSlug = entry.teamSlug;
    if (!teamSlug) return;
    this.busyId.set(entry.applicationId);
    this.league
      .updateTeam(teamSlug, { teamName })
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.store.patchSignUp(entry.applicationId, { teamName });
          this.toast.success('Team renamed.');
        },
        error: (err) => {
          this.toast.error(apiErrorMessage(err, 'Could not rename that team.'));
        },
      });
  }

  private persist(
    entry: SignUpValue,
    changes: {
      name?: string;
      gameName?: string;
      discordName?: string;
      timezone?: string;
    },
  ): void {
    const coachId = entry.id;
    if (!coachId) return;
    this.busyId.set(entry.applicationId);
    this.manage
      .updateCoachDetails(coachId, changes)
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.store.patchSignUp(entry.applicationId, changes);
          this.toast.success('Details updated.');
        },
        error: (err) => {
          this.toast.error(
            apiErrorMessage(err, 'Could not save those details.'),
          );
        },
      });
  }

  protected async replaceCoach(entry: SignUpValue): Promise<void> {
    if (!entry.teamSlug) return;

    const result = await this.dialogs.open<
      ReplaceCoachDialogComponent,
      ReplaceCoachDialogResult,
      ReplaceCoachDialogData
    >(ReplaceCoachDialogComponent, {
      heading: `Replace ${entry.coach}`,
      data: { teamName: entry.teamName, candidates: this.subPool() },
    }).closed;
    if (!result) return;

    this.busyId.set(entry.applicationId);
    this.league
      .replaceCoach(entry.teamSlug, {
        applicationId: result.applicationId,
        teamName: result.teamName,
        reason: result.reason,
      })
      .pipe(finalize(() => this.busyId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success(`${entry.teamName} handed over.`);
          this.store.load();
        },
        error: (err) => {
          this.toast.error(
            apiErrorMessage(err, 'Could not replace that coach.'),
          );
        },
      });
  }

  private sendLogo(entry: SignUpValue, file: File): void {
    const teamSlug = entry.teamSlug;
    if (!teamSlug) return;
    this.busyId.set(entry.applicationId);
    let key: string | null = null;

    this.league
      .getLeagueUploadPresignedUrl(file.name, file.type || 'image/png')
      .pipe(
        tap((response) => (key = response.key)),
        switchMap((response) => this.uploads.uploadToS3(response, file)),
        switchMap((progress) => {
          if (progress.type === HttpEventType.UploadProgress) return of(null);
          if (progress instanceof HttpResponse && progress.ok && key) {
            return this.league.updateTeam(teamSlug, { logo: key });
          }
          return of(null);
        }),
        catchError((err) => {
          this.toast.error(apiErrorMessage(err, 'Logo upload failed.'));
          return of(null);
        }),
        finalize(() => this.busyId.set(null)),
      )
      .subscribe({
        next: (response) => {
          if (!response) return;
          if (key) this.store.patchSignUp(entry.applicationId, { logo: key });
          this.toast.success(`${entry.teamName} logo updated.`);
        },
      });
  }

  protected readiness(entry: SignUpValue): string[] {
    const issues: string[] = [];
    if (!entry.inDiscordServer) issues.push('Not in the Discord server');
    else if (entry.status === 'approved' && !entry.hasDiscordRole) {
      issues.push('Missing the coach role');
    }
    return issues;
  }
}
