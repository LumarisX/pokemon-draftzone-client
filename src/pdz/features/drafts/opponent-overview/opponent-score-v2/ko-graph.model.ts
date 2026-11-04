import {
  MatchKo,
  MatchPokemonRef,
  MatchSide,
} from '@pdz/features/drafts/matchup-overview/matchup.model';
import { ScoreEntryStatus } from '@pdz/shared/widgets/score-entry/score-entry.model';

export type KoSide = 'side1' | 'side2';

export type KoNodeState = 'back' | 'played' | 'fainted';

export type KoEdge = {
  from: string;
  to: string;
  indirect: boolean;
  note: string;
};

export type KoGraph = {
  states: Record<string, KoNodeState>;
  edges: KoEdge[];
};

export type KoKills = {
  direct: number;
  indirect: number;
  teammate: number;
};

export type KoSheets = Record<KoSide, readonly string[]>;

export const KO_SIDES: readonly KoSide[] = ['side1', 'side2'];

export const KO_SHEET_MAX = 6;

export const KO_STATE_LABELS: Readonly<Record<KoNodeState, string>> = {
  back: 'In the back',
  played: 'Survived',
  fainted: 'Fainted',
};

const NEXT_STATE: Readonly<Record<KoNodeState, KoNodeState>> = {
  back: 'played',
  played: 'fainted',
  fainted: 'back',
};

export function koKey(side: KoSide, id: string): string {
  return `${side}:${id}`;
}

export function koSideOf(key: string): KoSide {
  return key.slice(0, key.indexOf(':')) as KoSide;
}

export function koIdOf(key: string): string {
  return key.slice(key.indexOf(':') + 1);
}

export function emptyKoGraph(): KoGraph {
  return { states: {}, edges: [] };
}

export function emptyKoSheets(): KoSheets {
  return { side1: [], side2: [] };
}

export function koState(graph: KoGraph, key: string): KoNodeState {
  return graph.states[key] ?? 'back';
}

export function koIsPlaying(state: KoNodeState): boolean {
  return state !== 'back';
}

export function setKoState(
  graph: KoGraph,
  key: string,
  state: KoNodeState,
): KoGraph {
  const playing = koIsPlaying(state);
  return {
    states: { ...graph.states, [key]: state },
    edges: graph.edges.filter((edge) => {
      if (!playing && (edge.from === key || edge.to === key)) return false;
      return state === 'fainted' || edge.to !== key;
    }),
  };
}

export function cycleKoState(graph: KoGraph, key: string): KoGraph {
  return setKoState(graph, key, NEXT_STATE[koState(graph, key)]);
}

export function dropFromKoGraph(graph: KoGraph, key: string): KoGraph {
  const { [key]: _dropped, ...states } = graph.states;
  return {
    states,
    edges: graph.edges.filter((edge) => edge.from !== key && edge.to !== key),
  };
}

export function linkKo(graph: KoGraph, from: string, to: string): KoGraph {
  const existing = incomingKo(graph, to);
  if (existing?.from === from) return graph;

  const states = { ...graph.states, [to]: 'fainted' as KoNodeState };
  if (from !== to && !koIsPlaying(koState(graph, from))) {
    states[from] = 'played';
  }

  return {
    states,
    edges: [
      ...graph.edges.filter((edge) => edge.to !== to),
      { from, to, indirect: false, note: '' },
    ],
  };
}

export function unlinkKo(graph: KoGraph, to: string): KoGraph {
  return { ...graph, edges: graph.edges.filter((edge) => edge.to !== to) };
}

export function incomingKo(graph: KoGraph, key: string): KoEdge | undefined {
  return graph.edges.find((edge) => edge.to === key);
}

export function outgoingKos(graph: KoGraph, key: string): KoEdge[] {
  return graph.edges.filter((edge) => edge.from === key && edge.to !== key);
}

export function toggleKoIndirect(graph: KoGraph, to: string): KoGraph {
  return {
    ...graph,
    edges: graph.edges.map((edge) =>
      edge.to === to ? { ...edge, indirect: !edge.indirect } : edge,
    ),
  };
}

export function setKoNote(graph: KoGraph, to: string, note: string): KoGraph {
  return {
    ...graph,
    edges: graph.edges.map((edge) =>
      edge.to === to ? { ...edge, note: note.trim() } : edge,
    ),
  };
}

export function koStatus(graph: KoGraph, key: string): ScoreEntryStatus {
  switch (koState(graph, key)) {
    case 'played':
      return 'survived';
    case 'fainted':
      return 'fainted';
    default:
      return 'brought';
  }
}

export function koKills(graph: KoGraph, key: string): KoKills {
  return outgoingKos(graph, key).reduce<KoKills>(
    (totals, edge) => {
      if (koSideOf(edge.to) === koSideOf(key)) totals.teammate += 1;
      else if (edge.indirect) totals.indirect += 1;
      else totals.direct += 1;
      return totals;
    },
    { direct: 0, indirect: 0, teammate: 0 },
  );
}

export function koCountBy(
  graph: KoGraph,
  keys: readonly string[],
  state: KoNodeState,
): number {
  return keys.filter((key) => koState(graph, key) === state).length;
}

export function koSurvivors(graph: KoGraph, keys: readonly string[]): number {
  return koCountBy(graph, keys, 'played');
}

export function koGraphWinner(graph: KoGraph, sheets: KoSheets): KoSide | null {
  const side1 = koSurvivors(graph, sheets.side1);
  const side2 = koSurvivors(graph, sheets.side2);
  if (side1 === side2) return null;
  return side1 > side2 ? 'side1' : 'side2';
}

export function koStateFromStatus(
  status: ScoreEntryStatus | null | undefined,
): KoNodeState {
  switch (status) {
    case 'survived':
      return 'played';
    case 'fainted':
      return 'fainted';
    default:
      return 'back';
  }
}

export function koGraphFromStatuses(
  entries: readonly { key: string; status: ScoreEntryStatus | null }[],
  kos: readonly MatchKo[] = [],
): KoGraph {
  return {
    states: entries.reduce<Record<string, KoNodeState>>((states, entry) => {
      states[entry.key] = koStateFromStatus(entry.status);
      return states;
    }, {}),
    edges: koEdgesFromKos(kos),
  };
}

export function orderedSheet(
  roster: readonly string[],
  keys: Iterable<string>,
): string[] {
  const wanted = new Set(keys);
  return roster.filter((key) => wanted.has(key));
}

export function toggleSheetKey(
  sheet: readonly string[],
  roster: readonly string[],
  key: string,
): readonly string[] {
  if (sheet.includes(key)) return sheet.filter((entry) => entry !== key);
  if (sheet.length >= KO_SHEET_MAX) return sheet;
  return orderedSheet(roster, [...sheet, key]);
}

export function mergeSheet(
  sheet: readonly string[],
  roster: readonly string[],
  found: readonly string[],
): readonly string[] {
  if (!found.length) return sheet;
  const merged = orderedSheet(roster, [...sheet, ...found]);
  return merged.length > KO_SHEET_MAX ? orderedSheet(roster, found) : merged;
}

export function keepSheet(graph: KoGraph, sheets: KoSheets): KoGraph {
  const kept = new Set([...sheets.side1, ...sheets.side2]);
  return Object.keys(graph.states)
    .filter((key) => !kept.has(key))
    .reduce(dropFromKoGraph, graph);
}

const KO_SIDE_OF: Readonly<Record<MatchSide, KoSide>> = {
  a: 'side1',
  b: 'side2',
};

const MATCH_SIDE_OF: Readonly<Record<KoSide, MatchSide>> = {
  side1: 'a',
  side2: 'b',
};

function keyOfRef(ref: MatchPokemonRef): string {
  return koKey(KO_SIDE_OF[ref.team], ref.pokemon);
}

function refOfKey(key: string): MatchPokemonRef {
  return { team: MATCH_SIDE_OF[koSideOf(key)], pokemon: koIdOf(key) };
}

export function koEdgesFromKos(kos: readonly MatchKo[]): KoEdge[] {
  return kos.map((ko) => {
    const to = keyOfRef(ko.victim);
    return {
      from: ko.attacker ? keyOfRef(ko.attacker) : to,
      to,
      indirect: ko.indirect,
      note: ko.note ?? '',
    };
  });
}

export function kosFromKoGraph(graph: KoGraph): MatchKo[] {
  return graph.edges.map((edge) => {
    const ko: MatchKo = { victim: refOfKey(edge.to), indirect: edge.indirect };
    if (edge.from !== edge.to) ko.attacker = refOfKey(edge.from);
    if (edge.note) ko.note = edge.note;
    return ko;
  });
}
