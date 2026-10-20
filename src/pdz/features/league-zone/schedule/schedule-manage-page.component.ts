import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GuardsUnsavedChanges } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueManageService } from '@pdz/features/league-zone/league-manage/league-manage.service';
import { SaveBarComponent } from '@pdz/features/league-zone/tournament-settings/save-bar.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { forkJoin } from 'rxjs';
import { openAddStage } from './dialogs/add-stage-dialog.component';
import { confirmStageSeeds } from './dialogs/confirm-seeds-dialog.component';
import {
  projectionsFromBracket,
  savedMatchIds,
  teamsFromBracket,
  toScheduleDraft,
  toUpdatePayload,
} from './schedule.adapter';
import { ScheduleComponent } from './schedule.component';
import { ScheduleContext } from './schedule-entrants';
import { plural } from './schedule-format';
import { validateSchedule } from './schedule-validate';
import {
  ScheduleDraft,
  ScheduleTeam,
  StageProjection,
  defaultStartRound,
  nextLocalKey,
  padRounds,
} from './schedule.model';
import { TournamentBracket } from './tournament-bracket.model';

const EMPTY: ScheduleDraft = { rounds: [], stages: [], matches: [] };

@Component({
  selector: 'pdz-schedule-manage-page',
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    PageComponent,
    PageHeaderComponent,
    SaveBarComponent,
    ScheduleComponent,
    SkeletonLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-manage-page.component.html',
  styleUrl: './schedule-manage-page.component.scss',
})
export class ScheduleManagePageComponent implements GuardsUnsavedChanges {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly manageService = inject(LeagueManageService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly schedule = viewChild(ScheduleComponent);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly draft = signal<ScheduleDraft>(EMPTY);
  private readonly saved = signal<ScheduleDraft>(EMPTY);
  private savedIds = new Set<string>();

  protected readonly teams = signal<ReadonlyMap<string, ScheduleTeam>>(new Map());
  protected readonly teamOptions = signal<ScheduleTeam[]>([]);
  protected readonly projections = signal<ReadonlyMap<string, StageProjection>>(
    new Map(),
  );

  protected readonly changes = signal(0);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly currentRoundIndex = signal(-1);
  protected readonly settingRound = signal(false);
  protected readonly confirmingStage = signal<string | null>(null);

  protected readonly hasMatches = computed(() => this.saved().matches.length > 0);
  protected readonly canSetCurrentRound = computed(
    () => this.changes() === 0 && !this.saving() && !this.settingRound(),
  );

  private readonly context = computed<ScheduleContext>(() => ({
    teams: this.teams(),
    projections: this.projections(),
    stages: this.draft().stages,
  }));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      bracket: this.manageService.getTournamentBracket(),
      teams: this.leagueService.getTournamentTeams(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ bracket, teams }) => {
          const options = teams.teams
            .filter((team) => team.status === 'approved')
            .map((team) => ({
              teamId: team.id,
              teamName: team.teamName,
              coachName: team.coachName,
              logo: team.logo,
              poolName: team.pool?.name ?? null,
            }));
          this.teamOptions.set(options);
          this.apply(bracket, options);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(apiErrorMessage(err, 'Could not load the schedule.'));
        },
      });
  }

  private reload(): void {
    this.manageService.getTournamentBracket().subscribe({
      next: (bracket) => this.apply(bracket, this.teamOptions()),
      error: (err) =>
        this.toast.error(apiErrorMessage(err, 'Could not reload the schedule.')),
    });
  }

  private apply(bracket: TournamentBracket, options: ScheduleTeam[]): void {
    const teams = new Map<string, ScheduleTeam>();
    for (const team of options) teams.set(team.teamId, team);
    for (const [id, team] of teamsFromBracket(bracket))
      teams.set(id, { ...team, poolName: teams.get(id)?.poolName ?? null });
    const draft = toScheduleDraft(bracket);
    this.teams.set(teams);
    this.projections.set(projectionsFromBracket(bracket));
    this.savedIds = savedMatchIds(bracket);
    this.saved.set(draft);
    this.draft.set(draft);
    this.currentRoundIndex.set(bracket.currentRoundIndex ?? -1);
    this.changes.set(0);
    this.saveError.set(null);
    this.loading.set(false);
  }

  protected onDraftChange(draft: ScheduleDraft): void {
    this.draft.set(draft);
    this.changes.update((n) => n + 1);
    this.saveError.set(null);
  }

  protected revert(): void {
    this.draft.set(this.saved());
    this.changes.set(0);
    this.saveError.set(null);
  }

  protected async addStage(round: number | null): Promise<void> {
    const draft = this.draft();
    const result = await openAddStage(this.dialogs, {
      key: nextLocalKey('stage'),
      draft,
      context: this.context(),
      teams: this.teamOptions(),
      start: round ?? defaultStartRound(draft),
    });
    if (!result) return;
    this.onDraftChange(
      padRounds({
        ...draft,
        stages: [...draft.stages, result.stage],
        matches: [...draft.matches, ...result.matches],
      }),
    );
    this.schedule()?.selectStage(result.stage.key);
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    const draft = this.draft();
    const [problem] = validateSchedule(draft);
    if (problem) {
      this.saveError.set(problem);
      return;
    }

    const random = draft.stages.filter(
      (stage) => stage.random && !stage.drawn && stage.entrants.length > 0,
    );
    if (random.length) {
      const confirmed = await this.dialogs.confirm('Save and draw seeds?', {
        message:
          `Random seeding: ${random.map((s) => `${s.name} (${plural(s.entrants.length, 'team')})`).join(', ')}. ` +
          'DraftZone draws once. There are no re-rolls, and every draw is permanently recorded.',
        confirmLabel: 'Save and Draw',
      });
      if (!confirmed) return;
    }

    this.saving.set(true);
    this.manageService
      .updateTournamentBracket(toUpdatePayload(draft, this.savedIds))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Schedule saved.');
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.saveError.set(apiErrorMessage(err, 'Could not save the schedule.'));
        },
      });
  }

  protected setCurrentRound(index: number): void {
    if (!this.canSetCurrentRound()) return;
    this.settingRound.set(true);
    this.manageService.setTournamentCurrentRound(index).subscribe({
      next: (result) => {
        this.settingRound.set(false);
        this.currentRoundIndex.set(result.currentRoundIndex);
        this.toast.success(
          result.currentRoundIndex < 0
            ? 'No week is live now.'
            : `${this.draft().rounds[result.currentRoundIndex]?.name ?? 'That week'} is live.`,
        );
      },
      error: (err) => {
        this.settingRound.set(false);
        this.toast.error(apiErrorMessage(err, 'Could not change the live week.'));
      },
    });
  }

  protected async confirmSeeds(stageKey: string): Promise<void> {
    const stage = this.draft().stages.find((s) => s.key === stageKey);
    if (!stage?.stageId) return;
    if (this.changes() > 0) {
      this.toast.warning('Save or revert your changes before confirming seeds.');
      return;
    }
    const seeds = await confirmStageSeeds(this.dialogs, {
      stage,
      context: this.context(),
      teams: this.teamOptions(),
    });
    if (!seeds?.length) return;
    this.confirmingStage.set(stageKey);
    this.manageService.confirmStageSeeds(stage.stageId, seeds).subscribe({
      next: (result) => {
        this.confirmingStage.set(null);
        this.toast.success(result.message);
        this.reload();
      },
      error: (err) => {
        this.confirmingStage.set(null);
        this.toast.error(apiErrorMessage(err, 'Could not confirm the seeds.'));
      },
    });
  }

  protected async clearAll(): Promise<void> {
    if (this.saving()) return;
    const confirmed = await this.dialogs.confirm('Delete every match in this tournament?', {
      message:
        'This removes every stage and match. A certified seeding record is permanent: if you draw again, the stage shows it was seeded more than once.',
      confirmLabel: 'Delete Everything',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.saving.set(true);
    this.manageService
      .updateTournamentBracket({
        rounds: this.saved().rounds.map((round) => ({
          ...(round.id ? { _id: round.id } : {}),
          name: round.name,
        })),
        stages: [],
        matches: [],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(apiErrorMessage(err, 'Could not delete the matches.'));
        },
      });
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.changes() === 0) return true;
    return this.dialogs.confirm('Leave without saving?', {
      message: 'Your schedule changes have not been saved.',
      confirmLabel: 'Leave',
      confirmColor: 'danger',
    });
  }
}
