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
import { profileLink } from '@pdz/core/route-paths';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { LeagueZoneService } from '../league-zone.service';
import { LeagueManageService } from '../league-manage/league-manage.service';
import {
  CoachEditDialogComponent,
  CoachEditDialogData,
  CoachEditDialogResult,
} from '../dialogs/coach-edit-dialog/coach-edit-dialog.component';
import {
  ReplaceCoachDialogComponent,
  ReplaceCoachDialogData,
  ReplaceCoachDialogResult,
} from '../dialogs/replace-coach-dialog/replace-coach-dialog.component';
import {
  SIGNUP_STATUS_LABELS,
  SignUpAnswerValue,
  SignUpStatus,
  SignUpValue,
  TEAM_STATUSES,
  poolClosedToNewTeams,
  signUpChoiceKey,
  signUpChoices,
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
  protected readonly profileLink = profileLink;
  protected readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);
  private readonly manage = inject(LeagueManageService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);

  protected readonly busyId = signal<string | null>(null);

  protected readonly statusLabels = SIGNUP_STATUS_LABELS;
  protected readonly choiceKey = signUpChoiceKey;

  protected readonly choices = computed(() =>
    signUpChoices(this.store.pools()),
  );

  protected readonly openPools = computed(() =>
    this.store.pools().filter((pool) => !poolClosedToNewTeams(pool)),
  );

  protected readonly canRandomize = computed(
    () =>
      this.openPools().length > 1 &&
      this.selectedIds().length > 1 &&
      this.store.applicantsDirtyCount() === 0 &&
      !this.store.saving(),
  );

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
        hint: 'Added with a team. Move teams between pools in Settings.',
        selectable: false,
        entries: entries.filter(
          (entry) =>
            !!entry.teamId && entry.status === 'approved' && !entry.departed,
        ),
      },
      {
        id: 'subs',
        label: 'Available to sub',
        hint: 'Subs and the waitlist. Replacements draw from here, or add one to a pool.',
        selectable: true,
        entries: this.subPool(),
      },
      {
        id: 'out',
        label: 'Not Participating',
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

  protected readonly teamStatuses = TEAM_STATUSES;

  protected setStatus(id: string, status: SignUpStatus): void {
    this.store.setSignUpStatus(id, status);
  }

  protected setChoice(id: string, key: string): void {
    this.store.setSignUpChoice(id, key);
  }

  protected bulk(key: string): void {
    this.store.setChoiceForAll(this.selectedIds(), key);
    this.selected.set(new Set());
  }

  protected async randomize(): Promise<void> {
    const ids = this.selectedIds();
    const pools = this.openPools();
    const confirmed = await this.dialogs.confirm(
      `Add ${ids.length} teams at random?`,
      {
        message: `They're split evenly across ${pools.map((pool) => pool.name).join(', ')}, counting teams already in each. The draw is final and saves right away.`,
        confirmLabel: 'Add at Random',
      },
    );
    if (!confirmed) return;
    this.store
      .seatAtRandom(
        ids,
        pools.map((pool) => pool.slug),
      )
      .subscribe({
        next: () => this.selected.set(new Set()),
        error: (err) =>
          this.toast.error(apiErrorMessage(err, 'Could not place those teams.')),
      });
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
        next: () => this.store.dropSignUp(entry.applicationId),
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
        timezone: entry.timezone,
      },
    }).closed;
    if (!result) return;

    this.persist(entry, {
      name: result.name,
      gameName: result.gameName,
      timezone: result.timezone,
    });
  }

  private persist(
    entry: SignUpValue,
    changes: {
      name?: string;
      gameName?: string;
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
        next: () => this.store.patchSignUp(entry.applicationId, changes),
        error: (err) =>
          this.toast.error(
            apiErrorMessage(err, 'Could not save those details.'),
          ),
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
          this.store.refreshRoster();
        },
        error: (err) => {
          this.toast.error(
            apiErrorMessage(err, 'Could not replace that coach.'),
          );
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
