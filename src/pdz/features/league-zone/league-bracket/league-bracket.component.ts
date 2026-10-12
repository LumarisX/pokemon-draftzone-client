import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { toBuilderDraft } from '@pdz/features/league-zone/league-stage-builder/stage-builder.adapter';
import { BuilderDraft } from '@pdz/features/league-zone/league-stage-builder/stage-builder.model';
import { StageBuilderComponent } from '@pdz/features/league-zone/league-stage-builder/stage-builder.component';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, of } from 'rxjs';
import { waitingMessage } from '../tournament-milestones';
import { BracketTeamFlex } from './bracket.model';

@Component({
  selector: 'pdz-league-bracket',
  imports: [
    SkeletonLayoutComponent,
    StageBuilderComponent,
    ChipComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueBracketComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly isLoading = signal(true);
  readonly draft = signal<BuilderDraft>({ rounds: [], stages: [], matches: [] });
  readonly teamsByStage = signal(new Map<string, BracketTeamFlex[]>());
  readonly currentRoundIndex = signal(-1);

  private readonly info = toSignal(
    this.leagueService.getLeagueInfo().pipe(catchError(() => of(null))),
  );

  readonly noScheduleMessage = computed(() =>
    waitingMessage(
      'The schedule appears here once the organizers publish it.',
      this.info(),
    ),
  );

  readonly hasBracket = computed(() => this.draft().matches.length > 0);
  readonly currentRoundName = computed(
    () => this.draft().rounds[this.currentRoundIndex()]?.name ?? null,
  );
  readonly playedCount = computed(
    () =>
      this.draft().matches.filter((match) => match.winner !== undefined)
        .length,
  );

  readonly matchupLinkBase = computed(() => {
    const league = this.leagueService.leagueSlug();
    const tournament = this.leagueService.tournamentSlug();
    if (!league || !tournament) return null;
    return ['/', LEAGUE_ZONE_PATH, league, 'tournaments', tournament];
  });

  constructor() {
    this.leagueService
      .getTournamentBracket()
      .pipe(takeUntilDestroyed())
      .subscribe((bracket) => {
        this.draft.set(toBuilderDraft(bracket));
        this.currentRoundIndex.set(bracket.currentRoundIndex ?? -1);
        this.teamsByStage.set(
          new Map(
            (bracket.stages ?? []).map((stage) => [
              stage._id,
              stage.teams
                .slice()
                .sort((a, b) => a.seed - b.seed)
                .map((team) => ({
                  seed: team.seed,
                  teamName: team.teamName,
                  coachName: team.coachName,
                  logo: team.logo,
                  teamId: team.teamId,
                  teamSlug: team.teamSlug,
                })),
            ]),
          ),
        );
        this.isLoading.set(false);
      });
  }
}
