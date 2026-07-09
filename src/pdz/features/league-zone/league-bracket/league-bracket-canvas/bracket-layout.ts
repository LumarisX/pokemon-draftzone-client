import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
} from '../bracket.model';

// ─── Layout constants (world-space pixels at zoom 1) ─────────────────────────

/** Width of a match card / round column. */
export const COL_W = 240;
/** Horizontal lane between round columns that connector paths travel through. */
export const COL_GAP = 80;
/** Height of one match card. */
export const MATCH_H = 140;
/** Minimum vertical gap between leaf-round cards. */
export const MATCH_GAP = 16;
/** Vertical gap between stacked sections. */
export const SECTION_GAP = 32;

/** Card inner metrics: PAD + LABEL_H + ROW_GAP + TEAM_H + ROW_GAP + TEAM_H + PAD = MATCH_H. */
export const CARD_PAD = 6;
export const LABEL_H = 24;
export const ROW_GAP = 4;
export const TEAM_H = 48;

/** Spacing between parallel connector lanes in a corridor or band. */
export const LANE_STEP = 10;
/** Padding between cards and the outermost connector lane in a corridor. */
export const CORRIDOR_PAD = 14;
/** Padding between section content and the outermost lane in a section-gap band. */
export const BAND_PAD = 14;

/** Section title text + padding + underline. */
export const SECTION_TITLE_H = 28;
export const SECTION_TITLE_GAP = 12;
/** Round-title header row height. */
export const HEADER_H = 26;
/** Edit-mode "+ Match" / "+ Round" button height. */
export const ADD_BTN_H = 34;

// ─── Layout output model ──────────────────────────────────────────────────────

export interface CanvasSlot {
  raw: BracketSlotFlex;
  team: BracketTeamFlex | null;
  placeholder: string | null;
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
  /** World-space y of each team row's top edge. */
  slotY: [number, number];
  slots: [CanvasSlot, CanvasSlot];
}

export interface CanvasColumn {
  section: string;
  round: number;
  title: string;
  x: number;
  headerY: number;
  /** World-space y where this column's card area begins. */
  cardsTop: number;
}

export interface CanvasSectionBlock {
  key: string;
  title: string;
  y: number;
  /** Underlined title bar; absent when the section has no visible title. */
  titleY: number | null;
  headerY: number;
  cardsTop: number;
  columns: CanvasColumn[];
  /** World-space y just past the section's content. */
  bottom: number;
  /** Total width spanned by this section's columns (including edit-mode + Round column). */
  width: number;
}

export interface CanvasConnector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** X of the first vertical segment (its corridor lane). Unique per lane so
   *  parallel lines never stack on one x. */
  midX: number;
  /** Which outcome this line carries — winner lines are green, loser lines red. */
  cls: 'winner' | 'loser';
  /** True once the source match has a recorded winner: solid line anchored to
   *  the advancing/eliminated team's row instead of a dashed line from the
   *  card's center. */
  decided: boolean;
  /** Orthogonal polyline the renderer traces (corners get rounded). Every
   *  segment runs inside a corridor (gap between columns) or a band (gap
   *  between sections), never across cards. */
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
  /** Edit-mode "+ Match" buttons, one per round column. */
  addMatchButtons: CanvasButton[];
  /** Edit-mode "+ Round" buttons, one per section (round = the next round number). */
  addRoundButtons: CanvasButton[];
}

// ─── Vertical centers ────────────────

/**
 * Assigns vertical centers to all matches via column-by-column compaction.
 *
 * Each section's rounds are processed left to right; within a column, matches
 * (in `position` order) are placed at the average of their input centers, but
 * never above the previous card plus the minimum gap. `position` values only
 * determine ordering, never absolute offsets — sparse or 1-indexed positions
 * (e.g. after bye compaction) don't leave holes in the column.
 *
 * Only same-section inputs pull on a match's center: sections are stacked and
 * normalized independently, so a cross-section reference (a losers-bracket
 * drop) must not drag the destination section's geometry around.
 */
export function computeVerticalCenters(
  matches: FlexBracketMatch[],
): Map<string, number> {
  const centers = new Map<string, number>();
  const stride = MATCH_H + MATCH_GAP;
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
      let cursor = MATCH_H / 2;
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

  // Normalize each section so its topmost card sits flush with the section's
  // card area even when every first-column match was pulled down by inputs.
  for (const rounds of sections.values()) {
    const sectionCenters: number[] = [];
    for (const group of rounds.values()) {
      for (const m of group) sectionCenters.push(centers.get(m.id)!);
    }
    const offset = Math.min(...sectionCenters) - MATCH_H / 2;
    if (offset !== 0) {
      for (const group of rounds.values()) {
        for (const m of group) centers.set(m.id, centers.get(m.id)! - offset);
      }
    }
  }

  return centers;
}

// ─── Slot resolution ─────────────────

/**
 * Resolves a slot to its actual team by recursively following winner/loser chains.
 * Returns a placeholder when the source match has not yet been played.
 */
export function resolveSlot(
  slot: BracketSlotFlex,
  teams: BracketTeamFlex[],
  allMatches: FlexBracketMatch[],
  depth = 0,
): { team: BracketTeamFlex | null; placeholder: string | null } {
  if (depth > 20) return { team: null, placeholder: 'TBD' };

  if (slot.type === 'seed' || slot.type === 'bye') {
    const team = teams.find((t) => t.seed === slot.seed) ?? null;
    return { team, placeholder: team ? null : `Seed ${slot.seed}` };
  }

  if (slot.type === 'winner') {
    const src = allMatches.find((m) => m.id === slot.from);
    if (src?.winner !== undefined) {
      const advancingSlot = src.winner === 0 ? src.a : src.b;
      return resolveSlot(advancingSlot, teams, allMatches, depth + 1);
    }
    return { team: null, placeholder: `` };
  }

  if (slot.type === 'loser') {
    const src = allMatches.find((m) => m.id === slot.from);
    if (src?.winner !== undefined) {
      const eliminatedSlot = src.winner === 0 ? src.b : src.a;
      return resolveSlot(eliminatedSlot, teams, allMatches, depth + 1);
    }
    return { team: null, placeholder: `L of ${slot.from}` };
  }

  if (slot.type === 'empty') {
    return { team: null, placeholder: 'Unassigned' };
  }

  return { team: null, placeholder: null };
}

// ─── Titles ──────────────────────────

export function computeRoundTitles(
  roundNums: number[],
  sectionKey: string,
  totalTeams: number,
  overrides?: Record<number, string>,
): string[] {
  const n = roundNums.length;
  const isWinners = sectionKey === 'main' || sectionKey === 'winners';
  const isFinals = sectionKey === 'finals' || sectionKey === 'grand-finals';

  return roundNums.map((rn, idx) => {
    if (overrides?.[rn]) return overrides[rn];
    const fromEnd = n - 1 - idx;
    if (isFinals) {
      // First finals round is the Grand Finals; any later round is the reset.
      // (The old DOM renderer had this reversed — kept correct here to match
      // the server's roundName() ordering.)
      return idx === 0 ? 'Grand Finals' : 'Grand Finals Reset';
    }
    if (isWinners) {
      if (fromEnd === 0) return 'Finals';
      if (fromEnd === 1) return 'Semi-Finals';
      if (fromEnd === 2) return 'Quarter-Finals';
      const roundOf = Math.min(Math.pow(2, fromEnd + 1), totalTeams);
      return `Round of ${roundOf}`;
    }
    return `Round ${idx + 1}`;
  });
}

export function autoSectionTitle(key: string): string {
  const titles: Record<string, string> = {
    main: '',
    winners: 'Winners Bracket',
    losers: 'Losers Bracket',
    finals: 'Grand Finals',
    'grand-finals': 'Grand Finals',
  };
  return titles[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

// ─── Full layout computation ──────────────────────────────────────────────────

function slotStatus(
  winner: 0 | 1 | undefined,
  slotIndex: 0 | 1,
): 'winner' | 'loser' | 'undecided' {
  if (winner === undefined) return 'undecided';
  return winner === slotIndex ? 'winner' : 'loser';
}

/**
 * Computes the complete world-space layout for a bracket: section blocks,
 * round columns, match card rects, connector line endpoints, and edit-mode
 * button rects. Pure — no DOM, no canvas.
 */
export function computeBracketLayout(
  data: FlexBracketData,
  editable: boolean,
): CanvasLayout {
  const { teams, matches, sections: sectionCfgs } = data;
  const verticalCenters = computeVerticalCenters(matches);
  const matchLabelById = new Map<string, string>();

  // Determine section keys and their ordering. In edit mode, sections
  // configured but not yet holding any matches still need to render (with
  // an "add first match" affordance) so an organizer can bootstrap one.
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

  // ── Grid metadata ──────────────────────────────────────────────────────────
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
  const colIdxOf = (m: FlexBracketMatch): number =>
    roundNumsBySection.get(m.section ?? 'main')!.indexOf(m.round);

  // ── Connector routing ──────────────────────────────────────────────────────
  // Classify every winner/loser edge before any geometry exists, so corridors
  // (vertical gaps between columns) and bands (horizontal gaps between
  // sections) can size themselves to the number of lines they carry.
  //
  // - straight/elbow: same section, next column — the classic bracket line
  //   through the corridor between the two columns.
  // - bus: everything else (cross-section drops, column skips, backward
  //   links). Routed out of the source into the corridor right of its column,
  //   vertically to the band above the destination's section, horizontally to
  //   the corridor left of the destination column, then to the destination
  //   row. Every segment runs inside a corridor or a band, so bus lines never
  //   cross cards. Columns share one x-grid across all sections, which keeps
  //   corridors card-free over the full canvas height.
  interface ConnectorRoute {
    fromId: string;
    destId: string;
    slotIndex: 0 | 1;
    cls: 'winner' | 'loser';
    decided: boolean;
    kind: 'straight' | 'elbow' | 'bus';
    srcSection: string;
    /** Corridor holding the segment that leaves the source (elbow: the only one). */
    corrOut: number;
    laneOut: number;
    /** Corridor holding the segment that enters the destination (bus only). */
    corrIn: number;
    laneIn: number;
    /** Section index whose band above carries the horizontal run (bus only). */
    bandSection: number;
    bandLane: number;
  }

  /** Section-relative center y of a team row, from the section-relative match center. */
  const relRowCenter = (id: string, row: 0 | 1): number => {
    const top = (verticalCenters.get(id) ?? MATCH_H / 2) - MATCH_H / 2;
    return (
      top + CARD_PAD + LABEL_H + ROW_GAP + row * (TEAM_H + ROW_GAP) + TEAM_H / 2
    );
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
      const decided = src.winner !== undefined;

      const y1Rel = decided
        ? relRowCenter(
            src.id,
            raw.type === 'winner' ? src.winner! : ((1 - src.winner!) as 0 | 1),
          )
        : (verticalCenters.get(src.id) ?? 0);
      const y2Rel = relRowCenter(dest.id, slotIndex as 0 | 1);

      const adjacent = srcSection === destSection && destCol === srcCol + 1;
      routes.push({
        fromId: src.id,
        destId: dest.id,
        slotIndex: slotIndex as 0 | 1,
        cls: raw.type,
        decided,
        kind: adjacent
          ? Math.abs(y2Rel - y1Rel) < 2
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

  // Lane bookkeeping: bus lines get globally unique lanes per corridor (their
  // vertical runs can span several sections), while elbow lanes are unique
  // within a section but reused across sections, offset past the bus lanes.
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

  // Corridor i sits left of column i; its width grows with its lane count.
  // Corridor 0 (left canvas margin) collapses to zero when unused.
  const corridorW = (c: number): number => {
    const lanes = laneTotals.get(c) ?? 0;
    const needed = lanes > 0 ? 2 * CORRIDOR_PAD + (lanes - 1) * LANE_STEP : 0;
    return c === 0 ? needed : Math.max(COL_GAP, needed);
  };
  const colXCache: number[] = [];
  const colX = (c: number): number => {
    while (colXCache.length <= c) {
      const i = colXCache.length;
      colXCache.push((i === 0 ? 0 : colXCache[i - 1] + COL_W) + corridorW(i));
    }
    return colXCache[c];
  };
  const laneX = (c: number, lane: number): number => {
    const w = corridorW(c);
    const lanes = laneTotals.get(c) ?? 1;
    return colX(c) - w + (w - (lanes - 1) * LANE_STEP) / 2 + lane * LANE_STEP;
  };

  // Horizontal band runs share a lane when their x-spans don't overlap
  // (greedy interval coloring), keeping band heights reasonable.
  const bandLaneCount = new Map<number, number>();
  {
    const runs = routes
      .filter((r) => r.kind === 'bus' && r.corrIn !== r.corrOut)
      .map((r) => {
        const a = laneX(r.corrOut, r.laneOut);
        const b = laneX(r.corrIn, r.laneIn);
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

  const bandTops: number[] = [];
  const bandHeights: number[] = [];

  let yCursor = 0;

  for (const sKey of sectionKeys) {
    const sIdx = sectionIdxByKey.get(sKey)!;
    const bandLanes = bandLaneCount.get(sIdx) ?? 0;
    const baseGap = sIdx === 0 ? 0 : SECTION_GAP;
    bandTops[sIdx] = yCursor;
    bandHeights[sIdx] =
      bandLanes > 0
        ? Math.max(baseGap, 2 * BAND_PAD + (bandLanes - 1) * LANE_STEP)
        : baseGap;
    yCursor += bandHeights[sIdx];

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
      sKey,
      teams.length,
      cfg?.roundTitles,
    );

    const title = cfg?.title ?? autoSectionTitle(sKey);
    const sectionY = yCursor;
    let titleY: number | null = null;
    if (title) {
      titleY = yCursor;
      yCursor += SECTION_TITLE_H + SECTION_TITLE_GAP;
    }
    const headerY = yCursor;
    yCursor += HEADER_H;
    const cardsTop = yCursor;

    const columns: CanvasColumn[] = [];
    let matchNumber = 1;
    let maxCardBottom = cardsTop + MATCH_H; // sections render at least one card tall

    roundNums.forEach((rn, idx) => {
      const colXPos = colX(idx);
      columns.push({
        section: sKey,
        round: rn,
        title: roundTitles[idx],
        x: colXPos,
        headerY,
        cardsTop,
      });

      const rawMatches = roundMap
        .get(rn)!
        .sort((a, b) => a.position - b.position);

      let colBottom = cardsTop;
      for (const m of rawMatches) {
        const vc = verticalCenters.get(m.id) ?? 0;
        const label = m.label ?? `Match ${matchNumber++}`;
        matchLabelById.set(m.id, label);

        const y = cardsTop + vc - MATCH_H / 2;
        const slotAY = y + CARD_PAD + LABEL_H + ROW_GAP;
        const slotBY = slotAY + TEAM_H + ROW_GAP;

        const resolvedA = resolveSlot(m.a, teams, matches);
        const resolvedB = resolveSlot(m.b, teams, matches);

        layoutMatches.push({
          id: m.id,
          section: sKey,
          round: m.round,
          position: m.position,
          label,
          winner: m.winner,
          replay: m.replay,
          x: colXPos,
          y,
          w: COL_W,
          h: MATCH_H,
          slotY: [slotAY, slotBY],
          slots: [
            { raw: m.a, ...resolvedA, status: slotStatus(m.winner, 0) },
            { raw: m.b, ...resolvedB, status: slotStatus(m.winner, 1) },
          ],
        });

        colBottom = Math.max(colBottom, y + MATCH_H);
        maxCardBottom = Math.max(maxCardBottom, y + MATCH_H);
      }

      if (editable) {
        addMatchButtons.push({
          section: sKey,
          round: rn,
          x: colXPos,
          y: colBottom + MATCH_GAP,
          w: COL_W,
          h: ADD_BTN_H,
        });
      }
    });

    let sectionWidth = roundNums.length
      ? colX(roundNums.length - 1) + COL_W
      : COL_W;
    if (editable) {
      const addRoundX = colX(roundNums.length);
      const nextRound = roundNums.length
        ? roundNums[roundNums.length - 1] + 1
        : 0;
      addRoundButtons.push({
        section: sKey,
        round: nextRound,
        x: addRoundX,
        y: cardsTop,
        w: COL_W,
        h: ADD_BTN_H,
      });
      sectionWidth = addRoundX + COL_W;
    }
    sectionWidth = Math.max(sectionWidth, COL_W);

    let sectionBottom = maxCardBottom;
    if (editable) {
      sectionBottom = Math.max(
        sectionBottom + MATCH_GAP + ADD_BTN_H,
        cardsTop + MATCH_H,
      );
    }

    layoutSections.push({
      key: sKey,
      title,
      y: sectionY,
      titleY,
      headerY,
      cardsTop,
      columns,
      bottom: sectionBottom,
      width: sectionWidth,
    });

    yCursor = sectionBottom;
  }

  /** Center y of a band lane (the horizontal run of a bus route). */
  const bandLaneY = (s: number, lane: number): number => {
    const lanes = bandLaneCount.get(s) ?? 1;
    return (
      bandTops[s] +
      (bandHeights[s] - (lanes - 1) * LANE_STEP) / 2 +
      lane * LANE_STEP
    );
  };

  // Connector endpoints: source card's right edge at its vertical center →
  // destination slot row's left edge at the row's vertical center.
  const matchLayoutById = new Map(layoutMatches.map((m) => [m.id, m]));
  const connectors: CanvasConnector[] = [];
  const routeByConnector: ConnectorRoute[] = [];

  for (const r of routes) {
    const src = matchLayoutById.get(r.fromId);
    const dest = matchLayoutById.get(r.destId);
    if (!src || !dest) continue;

    // Undecided: line leaves from the card's vertical center. Decided: it
    // leaves from the row of the team actually advancing (or eliminated).
    let y1 = src.y + src.h / 2;
    if (r.decided) {
      const sourceMatch = matchById.get(r.fromId)!;
      const rowIndex: 0 | 1 =
        r.cls === 'winner'
          ? sourceMatch.winner!
          : ((1 - sourceMatch.winner!) as 0 | 1);
      y1 = src.slotY[rowIndex] + TEAM_H / 2;
    }

    connectors.push({
      x1: src.x + src.w,
      y1,
      x2: dest.x,
      y2: dest.slotY[r.slotIndex] + TEAM_H / 2,
      midX: 0,
      cls: r.cls,
      decided: r.decided,
      points: [],
    });
    routeByConnector.push(r);
  }

  // Fan out lines that leave the same point (e.g. an undecided match feeding
  // both a winner and a loser slot) so they don't overlap at the origin.
  const byOrigin = new Map<string, CanvasConnector[]>();
  for (const conn of connectors) {
    const key = `${conn.x1}:${Math.round(conn.y1)}`;
    byOrigin.set(key, [...(byOrigin.get(key) ?? []), conn]);
  }
  for (const group of byOrigin.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.y2 - b.y2);
    const spread = Math.min(12, TEAM_H / group.length);
    group.forEach((conn, i) => {
      conn.y1 += (i - (group.length - 1) / 2) * spread;
    });
  }

  // Trace each route into its final polyline.
  connectors.forEach((conn, i) => {
    const r = routeByConnector[i];
    const { x1, y1, x2, y2 } = conn;
    if (r.kind === 'straight') {
      conn.midX = (x1 + x2) / 2;
      conn.points = [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ];
      return;
    }
    if (r.kind === 'elbow' || r.corrIn === r.corrOut) {
      // A bus whose out- and in-corridors coincide (cross-section, next
      // column) degenerates to a single vertical run straight through the band.
      const vx = laneX(r.corrOut, r.laneOut);
      conn.midX = vx;
      conn.points = [
        { x: x1, y: y1 },
        { x: vx, y: y1 },
        { x: vx, y: y2 },
        { x: x2, y: y2 },
      ];
      return;
    }
    const vxOut = laneX(r.corrOut, r.laneOut);
    const vxIn = laneX(r.corrIn, r.laneIn);
    const bandY = bandLaneY(r.bandSection, r.bandLane);
    conn.midX = vxOut;
    conn.points = [
      { x: x1, y: y1 },
      { x: vxOut, y: y1 },
      { x: vxOut, y: bandY },
      { x: vxIn, y: bandY },
      { x: vxIn, y: y2 },
      { x: x2, y: y2 },
    ];
  });

  const width = Math.max(0, ...layoutSections.map((s) => s.width));
  const height = layoutSections.length
    ? layoutSections[layoutSections.length - 1].bottom
    : 0;

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
