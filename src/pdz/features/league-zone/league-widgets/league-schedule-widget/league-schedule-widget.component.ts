import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { MatchupCardComponent } from '../../matchup-card/matchup-card.component';
import { MatchupCard } from '../../matchup-card/matchup-card.model';
import { scheduleMatchupToCard } from '../../matchup-card/schedule-matchup.adapter';

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
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule-widget.component.html',
  styleUrl: './league-schedule-widget.component.scss',
})
export class LeagueScheduleWidgetComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const base = [
            '/leagues',
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
        error: () => this.roundsLoaded.emit([]),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
