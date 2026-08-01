// ─── Server bracket → client bracket model ───────────────────────────────────
// Pure mapping, kept out of LeagueZoneService so it can be exercised directly:
// the round-axis translation below is the subtle part of loading a bracket.

import {
  BracketRoundMeta,
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
  FlexBracketSectionConfig,
} from './bracket.model';

export type RawBracketSlot =
  | { type: 'seed'; seed: number }
  | { type: 'winner'; from: string }
  | { type: 'loser'; from: string };

export type RawBracketMatch = {
  _id: string;
  round: string;
  roundName: string;
  section?: string | null;
  bracketRound?: number | null;
  position?: number | null;
  label?: string | null;
  a: RawBracketSlot | null;
  b: RawBracketSlot | null;
  winner?: 0 | 1;
  replay?: string;
};

export type RawBracketRound = {
  _id: string;
  name: string;
  matchDeadline: string | null;
  tradeDeadline?: string | null;
  bestOf?: number | null;
};

/** Seeding of one bracket section. Whole-stage seedings report a single group. */
export type BracketSeedingGroup = {
  method: 'certified-random' | 'manual';
  label: string | null;
  seedFrom: number | null;
  seedTo: number | null;
  inputTeamsHash: string | null;
  algorithmVersion: string | null;
};

export type BracketSeedingInfo = {
  /** "mixed" when the bracket's sections don't share one seeding method. */
  method: 'certified-random' | 'manual' | 'mixed';
  seededAt: string;
  inputTeamsHash: string | null;
  algorithmVersion: string | null;
  /** Generations, not sections — one save seeds every section at once. */
  timesSeeded: number;
  groups?: BracketSeedingGroup[];
};

export type RawBracketSection = {
  key: string;
  title: string | null;
  kind: string | null;
  label: string | null;
  order: number;
  teamCount: number | null;
  roundTitles: Record<number, string> | null;
};

export type RawBracketResponse = {
  format: string | null;
  seeding?: BracketSeedingInfo | null;
  teams: BracketTeamFlex[];
  rounds: RawBracketRound[];
  sections?: RawBracketSection[] | null;
  matches: RawBracketMatch[];
};

export type BracketWithSeeding = FlexBracketData & {
  seeding?: BracketSeedingInfo | null;
  /** The stage's global round axis, in order. Row `i` of the builder grid. */
  rounds?: BracketRoundMeta[];
};

function mapBracketSlot(
  slot: RawBracketSlot | null | undefined,
): BracketSlotFlex | null {
  if (!slot) return null;
  return slot as BracketSlotFlex;
}

export function mapRawBracket(raw: RawBracketResponse): BracketWithSeeding {
  const seeding = raw.seeding ?? null;
  const rounds: BracketRoundMeta[] = (raw.rounds ?? []).map((r) => ({
    id: r._id,
    name: r.name,
    matchDeadline: r.matchDeadline,
    tradeDeadline: r.tradeDeadline ?? null,
    bestOf: r.bestOf ?? null,
  }));

  if (!raw.format || !raw.matches?.length) {
    return { teams: raw.teams ?? [], matches: [], rounds, seeding };
  }

  const roundIndexMap = new Map<string, number>();
  (raw.rounds ?? []).forEach((r, i) => roundIndexMap.set(r._id, i));

  // Matches generated after the section/position fields existed carry their
  // own layout; older brackets fall back to flat-round + insertion order.
  const positionCounters = new Map<string, number>();

  const matches: FlexBracketMatch[] = raw.matches.map((m) => {
    const section = m.section ?? undefined;
    // The stage's flat round list is the global axis. `bracketRound` is only a
    // section-relative echo of it, so it is the fallback for the rare matchup
    // saved without a round reference — never the preferred source.
    const roundIdx = roundIndexMap.get(m.round) ?? m.bracketRound ?? 0;
    const posKey = `${section ?? 'main'}:${roundIdx}`;
    const fallbackPosition = positionCounters.get(posKey) ?? 0;
    positionCounters.set(posKey, fallbackPosition + 1);

    return {
      id: m._id,
      round: roundIdx,
      position: m.position ?? fallbackPosition,
      ...(section ? { section } : {}),
      ...(m.label ? { label: m.label } : {}),
      a: mapBracketSlot(m.a) ?? { type: 'seed', seed: 0 },
      b: mapBracketSlot(m.b) ?? { type: 'seed', seed: 0 },
      ...(m.winner !== undefined ? { winner: m.winner } : {}),
      ...(m.replay ? { replay: m.replay } : {}),
    };
  });

  const hasSections = matches.some((m) => m.section);
  let sections: FlexBracketData['sections'];
  if (raw.sections?.length) {
    // Brackets saved with configured sections carry their own metadata —
    // titles, structural kind, and per-section team counts. Section keys may
    // be namespaced per block, so nothing here can be inferred from the key.
    sections = [...raw.sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        key: section.key,
        ...(section.title !== null ? { title: section.title } : {}),
        ...(section.kind
          ? { kind: section.kind as FlexBracketSectionConfig['kind'] }
          : {}),
        ...(section.label !== null ? { label: section.label } : {}),
        ...(section.teamCount !== null
          ? { teamCount: section.teamCount }
          : {}),
        ...(section.roundTitles ? { roundTitles: section.roundTitles } : {}),
        order: section.order,
      }));
  } else if (hasSections) {
    // Pre-sections brackets: winners/losers/finals were the only keys emitted.
    sections = [
      { key: 'winners', kind: 'winners' as const, order: 0 },
      { key: 'losers', kind: 'losers' as const, order: 1 },
      { key: 'finals', kind: 'finals' as const, order: 2 },
      { key: 'main', kind: 'main' as const, order: 3 },
    ].filter((s) => matches.some((m) => (m.section ?? 'main') === s.key));
  } else {
    const roundTitles: Record<number, string> = {};
    (raw.rounds ?? []).forEach((r, i) => {
      roundTitles[i] = r.name;
    });
    sections = [{ key: 'main', roundTitles }];
  }

  const format =
    raw.format === 'single-elimination'
      ? 'single-elim'
      : raw.format === 'double-elimination'
        ? 'double-elim'
        : 'custom';

  return { format, teams: raw.teams ?? [], matches, sections, rounds, seeding };
}
