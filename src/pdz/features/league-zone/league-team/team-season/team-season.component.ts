import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { ResultBoxComponent } from '@pdz/shared/data/result-box/result-box.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { SpriteState } from '@pdz/shared/images/sprite/sprite.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { formatMatchTime } from '@pdz/shared/time/timezone';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

export type SeasonResult = 'win' | 'loss' | 'draw';

export interface SeasonGame {
  mine: number;
  theirs: number;
  result: SeasonResult | null;
  replay: string | null;
}

export type GameLineup = { id: string; fainted: boolean }[];

export interface SeasonRow {
  id: string;
  round: string;
  opponent: {
    name: string;
    coach: string | null;
    logo: string | undefined;
    pending?: boolean;
  };
  result: SeasonResult | null;
  forfeit: boolean;
  score: { mine: number; theirs: number } | null;
  when: string | null;
  exactTime: boolean;
  link: string[] | null;
  roster: DraftPokemon[];
  games: SeasonGame[];
  lineups: GameLineup[];
}

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

export function gameResult(mine: boolean, theirs: boolean): SeasonResult | null {
  if (mine) return 'win';
  if (theirs) return 'loss';
  return null;
}

export function rosterStates(
  roster: readonly DraftPokemon[],
  lineups: readonly GameLineup[],
): (SpriteState | null)[] {
  const played = lineups.filter((lineup) => lineup.length);
  if (!played.length) return roster.map(() => null);
  return roster.map((pokemon) => {
    const games = played
      .map((lineup) => lineup.find((entry) => entry.id === pokemon.id))
      .filter((entry) => !!entry);
    if (!games.length) return 'benched';
    return games.every((entry) => entry.fainted) ? 'fainted' : null;
  });
}

export function seasonRows(
  rounds: League.ScheduleRound[],
  teamSlug: string,
  base: string[],
): SeasonRow[] {
  const rows: SeasonRow[] = [];
  for (const round of rounds) {
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
        const games = (matchup.matches ?? []).map((game) => ({
          mine: mySide === 'side1' ? game.team1 : game.team2,
          theirs: mySide === 'side1' ? game.team2 : game.team1,
          replay: game.link || null,
        }));

        rows.push({
          id: matchup.id,
          round: round.name,
          opponent: {
            name: theirs.name || theirs.from?.label || 'To Be Decided',
            coach: known ? theirs.coach || null : null,
            logo: known ? getTeamLogoSrc(theirs.logo) : undefined,
            pending: !known,
          },
          result,
          forfeit: !!matchup.winner && /ffw|dffl/.test(matchup.winner),
          score: result
            ? { mine: mine.score ?? 0, theirs: theirs.score ?? 0 }
            : null,
          when: matchup.scheduledDate ?? round.matchDeadline ?? null,
          exactTime: !!matchup.scheduledDate,
          link: known ? [...base, 'matchups', matchup.slug] : null,
          roster: known ? (theirs.draft ?? []) : [],
          games: games.map((game) => ({
            mine: game.mine.score ?? 0,
            theirs: game.theirs.score ?? 0,
            result: gameResult(game.mine.winner, game.theirs.winner),
            replay: game.replay,
          })),
          lineups: games.map((game) =>
            Object.entries(game.theirs.team ?? {}).map(([id, stats]) => ({
              id,
              fainted: stats.status === 'fainted',
            })),
          ),
        });
      }
    }
  }
  return rows;
}

@Component({
  selector: 'pdz-team-season',
  imports: [
    ButtonComponent,
    ChipComponent,
    DisclosureComponent,
    EmptyStateComponent,
    NgTemplateOutlet,
    ResultBoxComponent,
    RouterLink,
    SkeletonComponent,
    RosterSpritesComponent,
    TeamComponent,
    TooltipDirective,
  ],
  templateUrl: './team-season.component.html',
  styleUrl: './team-season.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSeasonComponent {
  private readonly leagueService = inject(LeagueZoneService);

  readonly rounds = input<League.ScheduleRound[] | null>(null);
  readonly teamSlug = input('');
  readonly showLogos = input(true, { transform: booleanAttribute });
  readonly entries = input<SeasonRow[] | null>(null);
  readonly rowActions = input<TemplateRef<{ $implicit: SeasonRow }> | null>(
    null,
  );

  protected readonly placeholders = [0, 1, 2];

  private readonly base = computed(() => [
    '/',
    LEAGUE_ZONE_PATH,
    this.leagueService.leagueSlug() ?? '',
    'tournaments',
    this.leagueService.tournamentSlug() ?? '',
  ]);

  readonly rows = computed(() => {
    const entries = this.entries();
    if (entries) return entries;
    const rounds = this.rounds();
    if (!rounds) return null;
    return seasonRows(rounds, this.teamSlug(), this.base());
  });

  protected readonly matches = computed(() =>
    (this.rows() ?? []).map((row) => ({
      row,
      states: rosterStates(row.roster, row.lineups),
    })),
  );

  protected scoreLabel(
    result: SeasonResult | null,
    mine: number,
    theirs: number,
  ): string {
    const score = `${mine} to ${theirs}`;
    return result ? `${RESULT_LABEL[result]}, ${score}` : score;
  }

  protected readonly dateLabel = formatMatchTime;
}
