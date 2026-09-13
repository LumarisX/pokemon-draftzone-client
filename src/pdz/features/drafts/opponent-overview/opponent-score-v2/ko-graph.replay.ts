import {
  ReplayAnalysis,
  ReplayPlayer,
} from '@pdz/features/tools/replay_analyzer/replay.interface';
import {
  ScoreEntryReplayRosters,
  countRosterOverlap,
  matchReplayTeamToRoster,
  replayFormeIds,
} from '@pdz/shared/widgets/score-entry/score-entry.replay';
import {
  KO_SIDES,
  KoEdge,
  KoGraph,
  KoNodeState,
  KoSide,
  koIsPlaying,
  koKey,
  koStateFromStatus,
} from './ko-graph.model';

export type KoReplayResult = {
  graph: KoGraph;
  winner: KoSide | null;
  attributed: number;
  total: number;
};

function sideOrder(
  players: ReplayPlayer[],
  rosters: ScoreEntryReplayRosters,
): Record<KoSide, number> {
  const [first, second] = players;
  const straight =
    countRosterOverlap(first, rosters.side1) +
      countRosterOverlap(second, rosters.side2) >=
    countRosterOverlap(first, rosters.side2) +
      countRosterOverlap(second, rosters.side1);
  return straight ? { side1: 1, side2: 2 } : { side1: 2, side2: 1 };
}

export function koGraphFromReplay(
  analysis: ReplayAnalysis,
  rosters: ScoreEntryReplayRosters,
): KoReplayResult | null {
  const players = analysis.players.slice(0, 2);
  if (players.length < 2) return null;

  const order = sideOrder(players, rosters);
  const sideOf = (player: number): KoSide =>
    order.side1 === player ? 'side1' : 'side2';

  const states: Record<string, KoNodeState> = {};
  const lookup = new Map<string, string>();

  for (const side of KO_SIDES) {
    const player = players[order[side] - 1];
    const matched = matchReplayTeamToRoster(player.team, rosters[side]);
    for (const [rosterKey, mon] of matched) {
      const key = koKey(side, rosterKey);
      states[key] = koStateFromStatus(mon.status);
      for (const id of replayFormeIds(mon)) lookup.set(`${side}:${id}`, key);
    }
  }

  const edges = new Map<string, KoEdge>();
  const kos = analysis.kos ?? [];

  for (const ko of kos) {
    const victimSide = sideOf(ko.victim.player);
    const victim = lookup.get(`${victimSide}:${ko.victim.id}`);
    if (!victim) continue;
    states[victim] = 'fainted';

    const attackerSide = ko.attacker ? sideOf(ko.attacker.player) : null;
    const attacker =
      ko.attacker && attackerSide
        ? lookup.get(`${attackerSide}:${ko.attacker.id}`)
        : undefined;

    const from = ko.self || !attacker ? victim : attacker;
    if (from !== victim && !koIsPlaying(states[from] ?? 'benched')) {
      states[from] = 'played';
    }

    edges.set(victim, {
      from,
      to: victim,
      indirect: ko.indirect,
      note: ko.move ?? ko.cause ?? '',
    });
  }

  const wires = [...edges.values()];

  return {
    graph: { states, edges: wires },
    winner: players[order.side1 - 1].win
      ? 'side1'
      : players[order.side2 - 1].win
        ? 'side2'
        : null,
    attributed: wires.filter((edge) => edge.from !== edge.to).length,
    total: kos.length,
  };
}
