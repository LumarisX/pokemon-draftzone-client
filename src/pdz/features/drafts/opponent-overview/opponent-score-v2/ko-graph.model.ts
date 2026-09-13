import { ScoreEntryStatus } from '@pdz/shared/widgets/score-entry/score-entry.model';

export type KoSide = 'side1' | 'side2';

export type KoNodeState = 'benched' | 'preview' | 'played' | 'fainted';

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

export const KO_SIDES: readonly KoSide[] = ['side1', 'side2'];

export const KO_STATE_LABELS: Readonly<Record<KoNodeState, string>> = {
  benched: 'Benched',
  preview: 'Team preview only',
  played: 'Survived',
  fainted: 'Fainted',
};

const NEXT_STATE: Readonly<Record<KoNodeState, KoNodeState>> = {
  benched: 'played',
  preview: 'played',
  played: 'fainted',
  fainted: 'benched',
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

export function koState(graph: KoGraph, key: string): KoNodeState {
  return graph.states[key] ?? 'benched';
}

export function koIsPlaying(state: KoNodeState): boolean {
  return state === 'played' || state === 'fainted';
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

export function toggleKoPreview(graph: KoGraph, key: string): KoGraph {
  return setKoState(
    graph,
    key,
    koState(graph, key) === 'preview' ? 'benched' : 'preview',
  );
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

export function koStatus(graph: KoGraph, key: string): ScoreEntryStatus | null {
  switch (koState(graph, key)) {
    case 'preview':
      return 'brought';
    case 'played':
      return 'survived';
    case 'fainted':
      return 'fainted';
    default:
      return null;
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

export function koGraphWinner(
  graph: KoGraph,
  keys: Record<KoSide, readonly string[]>,
): KoSide | null {
  const side1 = koSurvivors(graph, keys.side1);
  const side2 = koSurvivors(graph, keys.side2);
  if (side1 === side2) return null;
  return side1 > side2 ? 'side1' : 'side2';
}

export function koStateFromStatus(
  status: ScoreEntryStatus | null | undefined,
): KoNodeState {
  switch (status) {
    case 'brought':
      return 'preview';
    case 'survived':
      return 'played';
    case 'fainted':
      return 'fainted';
    default:
      return 'benched';
  }
}

export function koGraphFromStatuses(
  entries: readonly { key: string; status: ScoreEntryStatus | null }[],
): KoGraph {
  return {
    states: entries.reduce<Record<string, KoNodeState>>((states, entry) => {
      states[entry.key] = koStateFromStatus(entry.status);
      return states;
    }, {}),
    edges: [],
  };
}
