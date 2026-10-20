import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { waitingMessage } from '@pdz/features/league-zone/tournament-milestones';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';
import {
  projectionsFromBracket,
  teamsFromBracket,
  toScheduleDraft,
} from './schedule.adapter';
import { ScheduleComponent } from './schedule.component';
import {
  ScheduleDraft,
  ScheduleTeam,
  StageProjection,
} from './schedule.model';

@Component({
  selector: 'pdz-schedule-page',
  imports: [
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    ScheduleComponent,
    SkeletonLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdz-page type="workspace">
      <pdz-page-header title="Schedule" />
      @if (loading()) {
        <pdz-skeleton-layout layout="board" />
      } @else if (error(); as message) {
        <pdz-empty-state
          kind="error"
          heading="The schedule didn't load"
          [message]="message"
          retry="event"
          (retried)="load()"
        />
      } @else if (hasMatches()) {
        <pdz-schedule
          [draft]="draft()"
          [teams]="teams()"
          [projections]="projections()"
          [currentRoundIndex]="currentRoundIndex()"
          [matchupLinkBase]="matchupLinkBase()"
        />
      } @else {
        <pdz-empty-state
          bordered
          kind="waiting"
          heading="No matches scheduled yet"
          [message]="waiting()"
        />
      }
    </pdz-page>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class SchedulePageComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly draft = signal<ScheduleDraft>({
    rounds: [],
    stages: [],
    matches: [],
  });
  protected readonly teams = signal<ReadonlyMap<string, ScheduleTeam>>(new Map());
  protected readonly projections = signal<ReadonlyMap<string, StageProjection>>(
    new Map(),
  );
  protected readonly currentRoundIndex = signal(-1);

  private readonly info = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
  );

  protected readonly waiting = computed(() =>
    waitingMessage(
      'The schedule appears here once the organizers publish it.',
      this.info(),
    ),
  );

  protected readonly hasMatches = computed(() => this.draft().matches.length > 0);

  protected readonly matchupLinkBase = computed(() => {
    const league = this.leagueService.leagueSlug();
    const tournament = this.leagueService.tournamentSlug();
    if (!league || !tournament) return null;
    return ['/', LEAGUE_ZONE_PATH, league, 'tournaments', tournament];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.leagueService
      .getTournamentBracket()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (bracket) => {
          this.draft.set(toScheduleDraft(bracket));
          this.teams.set(teamsFromBracket(bracket));
          this.projections.set(projectionsFromBracket(bracket));
          this.currentRoundIndex.set(bracket.currentRoundIndex ?? -1);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(apiErrorMessage(err, 'Could not load the schedule.'));
        },
      });
  }
}
