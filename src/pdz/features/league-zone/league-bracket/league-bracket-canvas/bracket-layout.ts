import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
} from '../bracket.model';

export const COL_W = 240;
export const COL_GAP = 80;
export const MATCH_GAP = 16;
export const SECTION_GAP = 32;

export const CARD_PAD = 6;
export const LABEL_H = 24;
export const ROW_GAP = 4;
export const TEAM_H_COMPACT = 24;
export const TEAM_H_FULL = 48;
export const matchHeight = (teamH: number): number =>
  CARD_PAD * 2 + LABEL_H + ROW_GAP * 2 + teamH * 2;

export const LANE_STEP = 4;
export const CORRIDOR_PAD = 14;
export const BAND_PAD = 14;

export const SECTION_TITLE_H = 28;
export const SECTION_TITLE_GAP = 12;
export const HEADER_H = 26;
export const ADD_BTN_H = 34;

export interface CanvasSlot extends ResolvedSlot {
  raw: BracketSlotFlex;
  status: 'winner' | 'loser' | 'undecided';
}

export interface CanvasMatch {
  id: string;
  section: string;
  round: number;
  position: number;
  label: string;
  winner?: 0 | 1;
  replay?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  slotY: [number, number];
  portX: [number, number];
  slots: [CanvasSlot, CanvasSlot];
}

export interface CanvasColumn {
  section: string;
  round: number;
  title: string;
  x: number;
  headerY: number;
  cardsTop: number;
}

export interface CanvasSectionBlock {
  key: string;
  title: string;
  x: number;
  titleY: number | null;
  headerY: number;
  cardsTop: number;
  columns: CanvasColumn[];
  bottom: number;
  width: number;
}

export interface CanvasConnector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  laneCoord: number;
  cls: 'winner' | 'loser';
  decided: boolean;
  points: { x: number; y: number }[];
}

export interface CanvasButton {
  section: string;
  round: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CanvasLayout {
  width: number;
  height: number;
  sections: CanvasSectionBlock[];
  matches: CanvasMatch[];
  connectors: CanvasConnector[];
  matchLabelById: Map<string, string>;
  addMatchButtons: CanvasButton[];
  addRoundButtons: CanvasButton[];
}

export function computePositionCenters(
  matches: FlexBracketMatch[],
  cardSize: number,
): Map<string, number> {
  const centers = new Map<string, number>();
  const stride = cardSize + MATCH_GAP;
  const sectionById = new Map(matches.map((m) => [m.id, m.section ?? 'main']));

  const getInputIds = (m: FlexBracketMatch): string[] => {
    const section = m.section ?? 'main';
    const ids: string[] = [];
    for (const slot of [m.a, m.b]) {
      if (
        (slot.type === 'winner' || slot.type === 'loser') &&
        sectionById.get(slot.from) === section
      ) {
        ids.push(slot.from);
      }
    }
    return ids;
  };

  const sections = new Map<string, Map<number, FlexBracketMatch[]>>();
  for (const m of matches) {
    const sKey = m.section ?? 'main';
    const rounds = sections.get(sKey) ?? new Map<number, FlexBracketMatch[]>();
    rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);
    sections.set(sKey, rounds);
  }

  for (const rounds of sections.values()) {
    const roundNums = [...rounds.keys()].sort((a, b) => a - b);
    for (const rn of roundNums) {
      const group = rounds.get(rn)!.sort((a, b) => a.position - b.position);
      let cursor = cardSize / 2;
      for (const m of group) {
        const resolved = getInputIds(m)
          .map((id) => centers.get(id))
          .filter((c): c is number => c !== undefined);
        const ideal = resolved.length
          ? resolved.reduce((a, b) => a + b, 0) / resolved.length
          : cursor;
        const center = Math.max(ideal, cursor);
        centers.set(m.id, center);
        cursor = center + stride;
      }
    }
  }

  for (const rounds of sections.values()) {
    const sectionCenters: number[] = [];
    for (const group of rounds.values()) {
      for (const m of group) sectionCenters.push(centers.get(m.id)!);
    }
    const offset = Math.min(...sectionCenters) - cardSize / 2;
    if (offset !== 0) {
      for (const group of rounds.values()) {
        for (const m of group) centers.set(m.id, centers.get(m.id)! - offset);
      }
    }
  }

  return centers;
}

export interface ResolvedSlot {
  team: BracketTeamFlex | null;
  placeholder: string | null;
  sourceId: string | null;
}

export interface MatchExit {
  winner: 0 | 1 | null;
  loser: 0 | 1 | null;
  settled: boolean;
  walkover: 0 | 1 | 'void' | null;
}

const OPEN: MatchExit = {
  winner: null,
  loser: null,
  settled: false,
  walkover: null,
};
const NOBODY: MatchExit = { ...OPEN, settled: true };

function recordedWinner(match: FlexBracketMatch): 0 | 1 | null | undefined {
  if (match.advances === 'none') return null;
  if (match.advances === 'side1') return 0;
  if (match.advances === 'side2') return 1;
  if (match.winner !== undefined) return match.winner;
  if (match.forfeit) return null;
  return undefined;
}

export function matchExit(
  match: FlexBracketMatch,
  allMatches: FlexBracketMatch[] = [],
  depth = 0,
): MatchExit {
  const recorded = recordedWinner(match);
  if (recorded === null) return NOBODY;
  if (recorded !== undefined)
    return {
      winner: recorded,
      loser: recorded === 0 ? 1 : 0,
      settled: true,
      walkover: null,
    };
  if (depth > 20) return OPEN;

  const isDead = (slot: BracketSlotFlex): boolean => {
    if (slot.type !== 'winner' && slot.type !== 'loser') return false;
    const src = allMatches.find((m) => m.id === slot.from);
    if (!src) return false;
    const exit = matchExit(src, allMatches, depth + 1);
    return exit.settled && exit[slot.type] === null;
  };

  const deadA = isDead(match.a);
  const deadB = isDead(match.b);
  if (deadA && deadB) return { ...NOBODY, walkover: 'void' };
  if (deadA) return { winner: 1, loser: null, settled: true, walkover: 1 };
  if (deadB) return { winner: 0, loser: null, settled: true, walkover: 0 };
  return OPEN;
}

export function advancingSideIndex(
  match: FlexBracketMatch,
  outcome: 'winner' | 'loser',
  allMatches: FlexBracketMatch[] = [],
): 0 | 1 | null {
  return matchExit(match, allMatches)[outcome];
}

export function resolveSlot(
  slot: BracketSlotFlex,
  teams: BracketTeamFlex[],
  allMatches: FlexBracketMatch[],
  matchLabels?: Map<string, string>,
  depth = 0,
): ResolvedSlot {
  if (depth > 20) return { team: null, placeholder: 'TBD', sourceId: null };

  if (slot.type === 'seed' || slot.type === 'bye') {
    const team = teams.find((t) => t.seed === slot.seed) ?? null;
    return {
      team,
      placeholder: team ? null : `Seed ${slot.seed}`,
      sourceId: null,
    };
  }

  if (slot.type === 'winner' || slot.type === 'loser') {
    const src = allMatches.find((m) => m.id === slot.from);
    const label = matchLabels?.get(slot.from) ?? slot.from;
    const outcome = slot.type === 'winner' ? 'Winner' : 'Loser';

    if (src) {
      const exit = matchExit(src, allMatches);
      const sideIndex = exit[slot.type];
      if (sideIndex !== null) {
        return resolveSlot(
          sideIndex === 0 ? src.a : src.b,
          teams,
          allMatches,
          matchLabels,
          depth + 1,
        );
      }
      if (exit.settled) {
        const reason =
          src.winner === undefined && src.forfeit && !src.advances
            ? `Double forfeit in ${label}`
            : `No ${outcome.toLowerCase()} from ${label}`;
        return { team: null, placeholder: reason, sourceId: slot.from };
      }
    }

    return {
      team: null,
      placeholder: `${outcome} of ${label}`,
      sourceId: slot.from,
    };
  }

  if (slot.type === 'empty') {
    return { team: null, placeholder: 'Unassigned', sourceId: null };
  }

  return { team: null, placeholder: null, sourceId: null };
}

export function computeRoundTitles(
  roundNums: number[],
  kind: string,
  totalTeams: number,
  overrides?: Record<number, string>,
): string[] {
  const n = roundNums.length;
  const isWinners = kind === 'main' || kind === 'winners';
  const isLosers = kind === 'losers';
  const isFinals = kind === 'finals' || kind === 'grand-finals';

  return roundNums.map((rn, idx) => {
    if (overrides?.[rn]) return overrides[rn];
    const fromEnd = n - 1 - idx;
    if (isFinals) {
      return idx === 0 ? 'Grand Finals' : 'Grand Finals Reset';
    }
    if (isWinners) {
      if (fromEnd === 0) return 'Finals';
      if (fromEnd === 1) return 'Semi-Finals';
      if (fromEnd === 2) return 'Quarter-Finals';
      const slots = Math.pow(2, fromEnd + 1);
      const roundOf = totalTeams > 0 ? Math.min(slots, totalTeams) : slots;
      return `Round of ${roundOf}`;
    }
    if (isLosers) {
      if (fromEnd === 0) return 'Finals';
      if (fromEnd === 1) return 'Semi-Finals';
      return `Round ${idx + 1}`;
    }
    return `Round ${idx + 1}`;
  });
}

export function autoSectionTitle(kind: string): string {
  const titles: Record<string, string> = {
    main: '',
    'round-robin': '',
    winners: 'Winners Bracket',
    losers: 'Losers Bracket',
    finals: 'Grand Finals',
    'grand-finals': 'Grand Finals',
  };
  return titles[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);
}

function slotStatus(
  match: FlexBracketMatch,
  slotIndex: 0 | 1,
  allMatches: FlexBracketMatch[],
): 'winner' | 'loser' | 'undecided' {
  const advancing = advancingSideIndex(match, 'winner', allMatches);
  if (advancing === null) return 'undecided';
  return advancing === slotIndex ? 'winner' : 'loser';
}

export function computeBracketLayout(
  data: FlexBracketData,
  editable: boolean,
): CanvasLayout {
  const { teams, matches, sections: sectionCfgs } = data;
  const maxSlotSeed = matches.reduce((mx, m) => {
    for (const slot of [m.a, m.b]) {
      if (slot.type === 'seed' || slot.type === 'bye') {
        mx = Math.max(mx, slot.seed);
      }
    }
    return mx;
  }, 0);
  const totalTeams = Math.max(teams.length, maxSlotSeed);
  const teamH = teams.length > 0 ? TEAM_H_FULL : TEAM_H_COMPACT;
  const matchH = matchHeight(teamH);
  const positionCenters = computePositionCenters(matches, COL_W);
  const matchLabelById = new Map<string, string>();

  const sectionKeys = [
    ...new Set([
      ...matches.map((m) => m.section ?? 'main'),
      ...(editable ? (sectionCfgs?.map((s) => s.key) ?? []) : []),
    ]),
  ];
  const sectionOrderMap = new Map<string, number>();
  sectionCfgs?.forEach((s, i) => sectionOrderMap.set(s.key, s.order ?? i));
  sectionKeys.forEach((k, i) => {
    if (!sectionOrderMap.has(k)) sectionOrderMap.set(k, 1000 + i);
  });
  sectionKeys.sort(
    (a, b) => (sectionOrderMap.get(a) ?? 0) - (sectionOrderMap.get(b) ?? 0),
  );

  const layoutSections: CanvasSectionBlock[] = [];
  const layoutMatches: CanvasMatch[] = [];
  const addMatchButtons: CanvasButton[] = [];
  const addRoundButtons: CanvasButton[] = [];

  const roundNumsBySection = new Map<string, number[]>();
  for (const sKey of sectionKeys) {
    roundNumsBySection.set(
      sKey,
      [
        ...new Set(
          matches
            .filter((m) => (m.section ?? 'main') === sKey)
            .map((m) => m.round),
        ),
      ].sort((a, b) => a - b),
    );
  }
  const sectionIdxByKey = new Map(sectionKeys.map((k, i) => [k, i] as const));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  for (const sKey of sectionKeys) {
    let matchNumber = 1;
    for (const rn of roundNumsBySection.get(sKey)!) {
      const roundMatches = matches
        .filter((m) => (m.section ?? 'main') === sKey && m.round === rn)
        .sort((a, b) => a.position - b.position);
      for (const m of roundMatches) {
        matchLabelById.set(m.id, m.label ?? `Match ${matchNumber++}`);
      }
    }
  }

  const colIdxOf = (m: FlexBracketMatch): number =>
    roundNumsBySection.get(m.section ?? 'main')!.indexOf(m.round);

  interface ConnectorRoute {
    fromId: string;
    destId: string;
    slotIndex: 0 | 1;
    cls: 'winner' | 'loser';
    decided: boolean;
    kind: 'straight' | 'elbow' | 'bus';
    srcSection: string;
    corrOut: number;
    laneOut: number;
    corrIn: number;
    laneIn: number;
    bandSection: number;
    bandLane: number;
  }

  const relPortOffset = (id: string, row: 0 | 1): number => {
    const center = positionCenters.get(id) ?? COL_W / 2;
    return center + (row === 0 ? -COL_W * 0.2 : COL_W * 0.2);
  };

  const routes: ConnectorRoute[] = [];
  for (const dest of matches) {
    [dest.a, dest.b].forEach((raw, slotIndex) => {
      if (raw.type !== 'winner' && raw.type !== 'loser') return;
      const src = matchById.get(raw.from);
      if (!src) return;

      const srcSection = src.section ?? 'main';
      const destSection = dest.section ?? 'main';
      const srcCol = colIdxOf(src);
      const destCol = colIdxOf(dest);
      const advancing = advancingSideIndex(src, raw.type, matches);
      const decided = advancing !== null;

      const x1Rel = decided
        ? relPortOffset(src.id, advancing)
        : (positionCenters.get(src.id) ?? 0);
      const x2Rel = relPortOffset(dest.id, slotIndex as 0 | 1);

      const adjacent = srcSection === destSection && destCol === srcCol + 1;
      routes.push({
        fromId: src.id,
        destId: dest.id,
        slotIndex: slotIndex as 0 | 1,
        cls: raw.type,
        decided,
        kind: adjacent
          ? Math.abs(x2Rel - x1Rel) < 2
            ? 'straight'
            : 'elbow'
          : 'bus',
        srcSection,
        corrOut: srcCol + 1,
        laneOut: 0,
        corrIn: destCol,
        laneIn: 0,
        bandSection: sectionIdxByKey.get(destSection) ?? 0,
        bandLane: 0,
      });
    });
  }

  const busLaneCount = new Map<number, number>();
  for (const r of routes) {
    if (r.kind !== 'bus') continue;
    busLaneCount.set(r.corrOut, (busLaneCount.get(r.corrOut) ?? 0) + 1);
    if (r.corrIn !== r.corrOut) {
      busLaneCount.set(r.corrIn, (busLaneCount.get(r.corrIn) ?? 0) + 1);
    }
  }
  const busCursor = new Map<number, number>();
  const elbowCursor = new Map<string, number>();
  const takeBusLane = (c: number): number => {
    const lane = busCursor.get(c) ?? 0;
    busCursor.set(c, lane + 1);
    return lane;
  };
  for (const r of routes) {
    if (r.kind === 'bus') {
      r.laneOut = takeBusLane(r.corrOut);
      r.laneIn = r.corrIn === r.corrOut ? r.laneOut : takeBusLane(r.corrIn);
    } else if (r.kind === 'elbow') {
      const key = `${r.corrOut}::${r.srcSection}`;
      const idx = elbowCursor.get(key) ?? 0;
      elbowCursor.set(key, idx + 1);
      r.laneOut = (busLaneCount.get(r.corrOut) ?? 0) + idx;
    }
  }

  const laneTotals = new Map<number, number>(busLaneCount);
  for (const [key, count] of elbowCursor) {
    const c = Number(key.split('::')[0]);
    laneTotals.set(
      c,
      Math.max(laneTotals.get(c) ?? 0, (busLaneCount.get(c) ?? 0) + count),
    );
  }

  const corridorH = (c: number): number => {
    const lanes = laneTotals.get(c) ?? 0;
    const needed = lanes > 0 ? 2 * CORRIDOR_PAD + (lanes - 1) * LANE_STEP : 0;
    return c === 0 ? needed : Math.max(COL_GAP, needed);
  };

  const kindOf = (sKey: string): string =>
    sectionCfgs?.find((s) => s.key === sKey)?.kind ?? sKey;
  const sectionTitleOf = (sKey: string): string =>
    sectionCfgs?.find((s) => s.key === sKey)?.title ??
    autoSectionTitle(kindOf(sKey));
  const hasAnyTitle = sectionKeys.some((sKey) => !!sectionTitleOf(sKey));
  const titleBandH = hasAnyTitle ? SECTION_TITLE_H + SECTION_TITLE_GAP : 0;

  const rowYCache: number[] = [];
  const rowTop = (c: number): number => {
    while (rowYCache.length <= c) {
      const i = rowYCache.length;
      const prevBottom = i === 0 ? titleBandH : rowYCache[i - 1] + matchH;
      rowYCache.push(prevBottom + corridorH(i) + HEADER_H);
    }
    return rowYCache[c];
  };
  const headerTop = (c: number): number => rowTop(c) - HEADER_H;
  const laneY = (c: number, lane: number): number => {
    const h = corridorH(c);
    const lanes = laneTotals.get(c) ?? 1;
    return (
      headerTop(c) - h + (h - (lanes - 1) * LANE_STEP) / 2 + lane * LANE_STEP
    );
  };

  const bandLaneCount = new Map<number, number>();
  {
    const runs = routes
      .filter((r) => r.kind === 'bus' && r.corrIn !== r.corrOut)
      .map((r) => {
        const a = laneY(r.corrOut, r.laneOut);
        const b = laneY(r.corrIn, r.laneIn);
        return { r, lo: Math.min(a, b), hi: Math.max(a, b) };
      })
      .sort((a, b) => a.lo - b.lo || a.hi - b.hi);
    const laneEnds = new Map<number, number[]>();
    for (const run of runs) {
      const ends = laneEnds.get(run.r.bandSection) ?? [];
      let lane = ends.findIndex((end) => run.lo >= end + LANE_STEP);
      if (lane === -1) {
        lane = ends.length;
        ends.push(run.hi);
      } else {
        ends[lane] = run.hi;
      }
      laneEnds.set(run.r.bandSection, ends);
      run.r.bandLane = lane;
      bandLaneCount.set(run.r.bandSection, ends.length);
    }
  }

  const bandLefts: number[] = [];
  const bandWidths: number[] = [];

  let xCursor = 0;

  for (const sKey of sectionKeys) {
    const sIdx = sectionIdxByKey.get(sKey)!;
    const bandLanes = bandLaneCount.get(sIdx) ?? 0;
    const baseGap = sIdx === 0 ? 0 : SECTION_GAP;
    bandLefts[sIdx] = xCursor;
    bandWidths[sIdx] =
      bandLanes > 0
        ? Math.max(baseGap, 2 * BAND_PAD + (bandLanes - 1) * LANE_STEP)
        : baseGap;
    xCursor += bandWidths[sIdx];

    const cfg = sectionCfgs?.find((s) => s.key === sKey);
    const sectionMatches = matches.filter(
      (m) => (m.section ?? 'main') === sKey,
    );

    const roundMap = new Map<number, FlexBracketMatch[]>();
    sectionMatches.forEach((m) => {
      roundMap.set(m.round, [...(roundMap.get(m.round) ?? []), m]);
    });

    const roundNums = roundNumsBySection.get(sKey)!;
    const roundTitles = computeRoundTitles(
      roundNums,
      cfg?.kind ?? sKey,
      cfg?.teamCount ?? totalTeams,
      cfg?.roundTitles,
    );

    const title = cfg?.title ?? autoSectionTitle(cfg?.kind ?? sKey);
    const sectionX = xCursor;
    const titleY: number | null = title ? 0 : null;

    const columns: CanvasColumn[] = [];
    let maxCardRight = sectionX + COL_W;

    roundNums.forEach((rn, idx) => {
      const rowCardsTop = rowTop(idx);
      const rowHeaderY = headerTop(idx);
      columns.push({
        section: sKey,
        round: rn,
        title: roundTitles[idx],
        x: sectionX,
        headerY: rowHeaderY,
        cardsTop: rowCardsTop,
      });

      const rawMatches = roundMap
        .get(rn)!
        .sort((a, b) => a.position - b.position);

      let rowRight = sectionX;
      for (const m of rawMatches) {
        const pc = positionCenters.get(m.id) ?? 0;
        const label = matchLabelById.get(m.id)!;

        const x = sectionX + pc - COL_W / 2;
        const y = rowCardsTop;
        const slotAY = y + CARD_PAD + LABEL_H + ROW_GAP;
        const slotBY = slotAY + teamH + ROW_GAP;

        const resolvedA = resolveSlot(m.a, teams, matches, matchLabelById);
        const resolvedB = resolveSlot(m.b, teams, matches, matchLabelById);

        layoutMatches.push({
          id: m.id,
          section: sKey,
          round: m.round,
          position: m.position,
          label,
          winner: m.winner,
          replay: m.replay,
          x,
          y,
          w: COL_W,
          h: matchH,
          slotY: [slotAY, slotBY],
          portX: [x + COL_W * 0.3, x + COL_W * 0.7],
          slots: [
            { raw: m.a, ...resolvedA, status: slotStatus(m, 0, matches) },
            { raw: m.b, ...resolvedB, status: slotStatus(m, 1, matches) },
          ],
        });

        rowRight = Math.max(rowRight, x + COL_W);
        maxCardRight = Math.max(maxCardRight, x + COL_W);
      }

      if (editable) {
        addMatchButtons.push({
          section: sKey,
          round: rn,
          x: rowRight + MATCH_GAP,
          y: rowCardsTop + (matchH - ADD_BTN_H) / 2,
          w: COL_W,
          h: ADD_BTN_H,
        });
      }
    });

    let sectionBottom = roundNums.length
      ? rowTop(roundNums.length - 1) + matchH
      : titleBandH + matchH;
    if (editable) {
      const addRoundY = rowTop(roundNums.length);
      const nextRound = roundNums.length
        ? roundNums[roundNums.length - 1] + 1
        : 0;
      addRoundButtons.push({
        section: sKey,
        round: nextRound,
        x: sectionX,
        y: addRoundY,
        w: COL_W,
        h: ADD_BTN_H,
      });
      sectionBottom = addRoundY + ADD_BTN_H;
    }
    sectionBottom = Math.max(sectionBottom, titleBandH + matchH);

    let sectionWidth = maxCardRight - sectionX;
    if (editable) {
      sectionWidth += MATCH_GAP + COL_W;
    }
    sectionWidth = Math.max(sectionWidth, COL_W);

    layoutSections.push({
      key: sKey,
      title,
      x: sectionX,
      titleY,
      headerY: columns.length ? columns[0].headerY : headerTop(0),
      cardsTop: columns.length ? columns[0].cardsTop : rowTop(0),
      columns,
      bottom: sectionBottom,
      width: sectionWidth,
    });

    xCursor = sectionX + sectionWidth;
  }

  const bandLaneX = (s: number, lane: number): number => {
    const lanes = bandLaneCount.get(s) ?? 1;
    return (
      bandLefts[s] +
      (bandWidths[s] - (lanes - 1) * LANE_STEP) / 2 +
      lane * LANE_STEP
    );
  };

  const matchLayoutById = new Map(layoutMatches.map((m) => [m.id, m]));
  const connectors: CanvasConnector[] = [];
  const routeByConnector: ConnectorRoute[] = [];

  for (const r of routes) {
    const src = matchLayoutById.get(r.fromId);
    const dest = matchLayoutById.get(r.destId);
    if (!src || !dest) continue;

    let x1 = src.x + src.w / 2;
    if (r.decided) {
      const sourceMatch = matchById.get(r.fromId)!;
      const rowIndex = advancingSideIndex(sourceMatch, r.cls, matches);
      if (rowIndex !== null) x1 = src.portX[rowIndex];
    }

    connectors.push({
      x1,
      y1: src.y + src.h,
      x2: dest.portX[r.slotIndex],
      y2: dest.y,
      laneCoord: 0,
      cls: r.cls,
      decided: r.decided,
      points: [],
    });
    routeByConnector.push(r);
  }

  const byOrigin = new Map<string, CanvasConnector[]>();
  for (const conn of connectors) {
    const key = `${Math.round(conn.x1)}:${conn.y1}`;
    byOrigin.set(key, [...(byOrigin.get(key) ?? []), conn]);
  }
  for (const group of byOrigin.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.x2 - b.x2);
    const spread = Math.min(12, COL_W / 2 / group.length);
    group.forEach((conn, i) => {
      conn.x1 += (i - (group.length - 1) / 2) * spread;
    });
  }

  connectors.forEach((conn, i) => {
    const r = routeByConnector[i];
    const { x1, y1, x2, y2 } = conn;
    if (r.kind === 'straight') {
      conn.laneCoord = (y1 + y2) / 2;
      conn.points = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ];
      return;
    }
    if (r.kind === 'elbow' || r.corrIn === r.corrOut) {
      const vy = laneY(r.corrOut, r.laneOut);
      conn.laneCoord = vy;
      conn.points = [
        { x: x1, y: y1 },
        { x: x1, y: vy },
        { x: x2, y: vy },
        { x: x2, y: y2 },
      ];
      return;
    }
    const vyOut = laneY(r.corrOut, r.laneOut);
    const vyIn = laneY(r.corrIn, r.laneIn);
    const bandX = bandLaneX(r.bandSection, r.bandLane);
    conn.laneCoord = vyOut;
    conn.points = [
      { x: x1, y: y1 },
      { x: x1, y: vyOut },
      { x: bandX, y: vyOut },
      { x: bandX, y: vyIn },
      { x: x2, y: vyIn },
      { x: x2, y: y2 },
    ];
  });

  const width = layoutSections.length
    ? layoutSections[layoutSections.length - 1].x +
      layoutSections[layoutSections.length - 1].width
    : 0;
  const height = Math.max(0, ...layoutSections.map((s) => s.bottom));

  return {
    width,
    height,
    sections: layoutSections,
    matches: layoutMatches,
    connectors,
    matchLabelById,
    addMatchButtons,
    addRoundButtons,
  };
}
