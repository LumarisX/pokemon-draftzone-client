import { League } from '../league.interface';
import { MatchupCard, MatchupCardSlot } from './matchup-card.model';

const FORFEIT_WINNERS: League.MatchupWinner[] = ['side1ffw', 'side2ffw', 'dffl'];

function slotFor(
  side: League.MatchupSide,
  index: 0 | 1,
  matchup: League.Matchup,
  base: string[],
): MatchupCardSlot {
  const winnerIs = (which: 0 | 1) =>
    which === 0
      ? matchup.winner === 'side1' || matchup.winner === 'side1ffw'
      : matchup.winner === 'side2' || matchup.winner === 'side2ffw';
  const decided = !!matchup.winner;

  return {
    name: side.name,
    coach: side.coach || null,
    logo: side.logo,
    pending: !side.slug,
    status: winnerIs(index)
      ? 'winner'
      : winnerIs(index === 0 ? 1 : 0)
        ? 'loser'
        : 'undecided',
    score: decided ? (side.score ?? 0) : null,
    link: side.slug
      ? [...base, 'teams', side.slug]
      : side.from
        ? [...base, 'matchups', side.from.slug]
        : null,
    sourceId: null,
  };
}

export function scheduleMatchupToCard(
  matchup: League.Matchup,
  base: string[],
): MatchupCard {
  const viewLink = [...base, 'matchups', matchup.slug];
  const decided = !!matchup.winner;
  const bothKnown = !!matchup.team1.slug && !!matchup.team2.slug;

  return {
    id: matchup.id,
    label: matchup.label ?? '',
    decided,
    forfeit: !!matchup.winner && FORFEIT_WINNERS.includes(matchup.winner),
    slots: [
      slotFor(matchup.team1, 0, matchup, base),
      slotFor(matchup.team2, 1, matchup, base),
    ],
    viewLink,
    breakdownLink: bothKnown && !decided ? [...viewLink, 'breakdown'] : null,
    replays: matchup.matches.map((match) => match.link).filter(Boolean),
  };
}
