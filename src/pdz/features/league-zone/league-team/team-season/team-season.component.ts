import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';

export type SeasonResult = 'win' | 'loss' | 'draw';

export interface SeasonRow {
  id: string;
  round: string;
  opponent: { name: string; coach: string | null; logo: string | undefined };
  result: SeasonResult | null;
  forfeit: boolean;
  score: { mine: number; theirs: number } | null;
  when: string | null;
  exactTime: boolean;
  link: string[] | null;
  next: boolean;
  roster: DraftPokemon[];
}

const RESULT_LETTER: Record<SeasonResult, string> = {
  win: 'W',
  loss: 'L',
  draw: 'D',
};

const RESULT_TONE: Record<SeasonResult, ChipTone> = {
  win: 'success',
  loss: 'danger',
  draw: 'neutral',
};

const RESULT_LABEL: Record<SeasonResult, string> = {
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
};

function resultFor(
  winner: League.MatchupWinner | undefined,
  mySide: 'side1' | 'side2',
): SeasonResult | null {
  if (!winner) return null;
  if (winner === 'draw') return 'draw';
  if (winner === 'dffl') return 'loss';
  const winningSide = winner.startsWith('side1') ? 'side1' : 'side2';
  return winningSide === mySide ? 'win' : 'loss';
}

export function seasonRows(
  rounds: League.ScheduleRound[],
  teamSlug: string,
  currentRoundIndex: number,
  base: string[],
): SeasonRow[] {
  const rows: SeasonRow[] = [];
  rounds.forEach((round, roundIndex) => {
    for (const stage of round.stages) {
      for (const matchup of stage.matchups) {
        const mySide =
          matchup.team1.slug === teamSlug
            ? 'side1'
            : matchup.team2.slug === teamSlug
              ? 'side2'
              : null;
        if (!mySide) continue;

        const mine = mySide === 'side1' ? matchup.team1 : matchup.team2;
        const theirs = mySide === 'side1' ? matchup.team2 : matchup.team1;
        const result = resultFor(matchup.winner, mySide);
        const known = !!theirs.slug;

        rows.push({
          id: matchup.id,
          round: round.name,
          opponent: {
            name: theirs.name || theirs.from?.label || 'To Be Decided',
            coach: known ? theirs.coach || null : null,
            logo: known ? getTeamLogoSrc(theirs.logo) : undefined,
          },
          result,
          forfeit: !!matchup.winner && /ffw|dffl/.test(matchup.winner),
          score: result
            ? { mine: mine.score ?? 0, theirs: theirs.score ?? 0 }
            : null,
          when: matchup.scheduledDate ?? round.matchDeadline ?? null,
          exactTime: !!matchup.scheduledDate,
          link: known ? [...base, 'matchups', matchup.slug] : null,
          next: false,
          roster: known ? (theirs.draft ?? []) : [],
        });
      }
    }
    if (roundIndex === currentRoundIndex) {
      const current = rows.filter((row) => row.round === round.name);
      current.forEach((row) => (row.next = row.result === null));
    }
  });

  if (!rows.some((row) => row.next)) {
    const upcoming = rows.find((row) => row.result === null);
    if (upcoming) upcoming.next = true;
  }
  return rows;
}

@Component({
  selector: 'pdz-team-season',
  imports: [
    ChipComponent,
    CountdownComponent,
    EmptyStateComponent,
    IconComponent,
    RouterLink,
    SkeletonComponent,
    SpriteComponent,
    TeamComponent,
  ],
  templateUrl: './team-season.component.html',
  styleUrl: './team-season.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSeasonComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly rounds = input.required<League.ScheduleRound[] | null>();
  readonly teamSlug = input.required<string>();
  readonly currentRoundIndex = input(0);

  protected readonly letter = RESULT_LETTER;
  protected readonly tone = RESULT_TONE;
  protected readonly resultLabel = RESULT_LABEL;
  protected readonly placeholders = [0, 1, 2];

  private readonly base = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueService.leagueSlug() ?? '',
    'tournaments',
    this.leagueService.tournamentSlug() ?? '',
  ]);

  readonly rows = computed(() => {
    const rounds = this.rounds();
    if (!rounds) return null;
    return seasonRows(
      rounds,
      this.teamSlug(),
      this.currentRoundIndex(),
      this.base(),
    );
  });

  readonly form = computed(() =>
    (this.rows() ?? [])
      .map((row) => row.result)
      .filter((result): result is SeasonResult => result !== null),
  );

  readonly formLabel = computed(() =>
    this.form()
      .map((result) => RESULT_LABEL[result])
      .join(', '),
  );

  protected dateLabel(value: string, exactTime: boolean): string {
    const date = new Date(value).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      ...(exactTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    });
    return exactTime ? date : `Due ${date}`;
  }
}
