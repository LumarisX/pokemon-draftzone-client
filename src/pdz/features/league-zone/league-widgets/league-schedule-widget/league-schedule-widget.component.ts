import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { MatchupCardComponent } from '@pdz/features/league-zone/matchup-card/matchup-card.component';
import { MatchupCard } from '@pdz/features/league-zone/matchup-card/matchup-card.model';
import { scheduleMatchupToCard } from '@pdz/features/league-zone/matchup-card/schedule-matchup.adapter';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';

interface ScheduleStageView {
  id: string;
  name: string;
  cards: MatchupCard[];
}

export interface ScheduleRoundView {
  id: string;
  name: string;
  matchDeadline: string | null;
  stages: ScheduleStageView[];
}

function cardHasTeam(card: MatchupCard, teamSlug: string): boolean {
  return card.slots.some((slot) => slot.slug === teamSlug);
}

function promoteTeam(
  round: ScheduleRoundView,
  teamSlug: string,
): ScheduleRoundView {
  const stages = [...round.stages];
  const stageIndex = stages.findIndex((stage) =>
    stage.cards.some((card) => cardHasTeam(card, teamSlug)),
  );
  if (stageIndex < 0) return round;

  const [stage] = stages.splice(stageIndex, 1);
  const cards = [...stage.cards];
  const cardIndex = cards.findIndex((card) => cardHasTeam(card, teamSlug));
  const [card] = cards.splice(cardIndex, 1);

  return {
    ...round,
    stages: [{ ...stage, cards: [card, ...cards] }, ...stages],
  };
}

@Component({
  selector: 'pdz-league-schedule-widget',
  imports: [EmptyStateComponent, MatchupCardComponent],
  templateUrl: './league-schedule-widget.component.html',
  styleUrl: './league-schedule-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueScheduleWidgetComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadedRounds = signal<ScheduleRoundView[] | undefined>(
    undefined,
  );

  readonly roundFilter = input<'current' | 'past'>();
  readonly showRoundTitle = input(true);
  readonly highlightTeamSlug = input<string | null>(null);
  readonly roundsLoaded = output<ScheduleRoundView[]>();

  readonly scheduleRounds = computed(() => {
    const rounds = this.loadedRounds();
    const teamSlug = this.highlightTeamSlug();
    if (!rounds || !teamSlug) return rounds;
    return rounds.map((round) => promoteTeam(round, teamSlug));
  });

  readonly highlightedCardId = computed(() => {
    const teamSlug = this.highlightTeamSlug();
    if (!teamSlug) return null;
    for (const round of this.loadedRounds() ?? []) {
      for (const stage of round.stages) {
        const card = stage.cards.find((entry) => cardHasTeam(entry, teamSlug));
        if (card) return card.id;
      }
    }
    return null;
  });

  ngOnInit(): void {
    this.leagueService
      .getSchedule({ round: this.roundFilter() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const base = [
            '/',
            LEAGUE_ZONE_PATH,
            this.leagueService.leagueSlug() ?? '',
            'tournaments',
            this.leagueService.tournamentSlug() ?? '',
          ];
          const rounds = data.rounds.map((round) => ({
            id: round._id,
            name: round.name,
            matchDeadline: round.matchDeadline ?? null,
            stages: round.stages.map((stage) => ({
              id: stage._id,
              name: stage.name,
              cards: stage.matchups.map((matchup) =>
                scheduleMatchupToCard(matchup, base),
              ),
            })),
          }));
          this.loadedRounds.set(rounds);
          this.roundsLoaded.emit(rounds);
        },
        error: () => {
          this.loadedRounds.set([]);
          this.roundsLoaded.emit([]);
        },
      });
  }
}
