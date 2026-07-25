import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
} from '../bracket.model';

// ─── Layout constants (world-space pixels at zoom 1) ─────────────────────────

/** Width of a match card / round row. */
export const COL_W = 240;
/** Minimum vertical gap between round rows that connector paths travel through. */
export const COL_GAP = 80;
/** Minimum horizontal gap between cards spread across a round. */
export const MATCH_GAP = 16;
/** Horizontal gap between side-by-side sections. */
export const SECTION_GAP = 32;

// Card inner metrics. A card is: PAD, label row, gap, team row, gap, team row, PAD.
export const CARD_PAD = 6;
export const LABEL_H = 24;
export const ROW_GAP = 4;
/** Height of one placeholder slot row ("Seed 2", "Winner of Match 3", …). */
export const TEAM_H_COMPACT = 24;
/** Height of one team row when real teams are bound — fits logo + name + coach. */
export const TEAM_H_FULL = 48;
/** Height of one match card for a given team-row height. */
export const matchHeight = (teamH: number): number =>
  CARD_PAD * 2 + LABEL_H + ROW_GAP * 2 + teamH * 2;

/** Spacing between parallel connector lanes in a corridor or band. */
export const LANE_STEP = 4;
/** Padding between cards and the outermost connector lane in a corridor. */
export const CORRIDOR_PAD = 14;
/** Padding between section content and the outermost lane in a band. */
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
  /** World-space x of each team row's connector port (bottom/top edge). */
  portX: [number, number];
  slots: [CanvasSlot, CanvasSlot];
}

export interface CanvasColumn {
  section: string;
  round: number;
  title: string;
  /** World-space x shared by every round in this section (rounds stack in y). */
  x: number;
  /** World-space y of this round's header strip — distinct per round. */
  headerY: number;
  /** World-space y where this round's card row begins. */
  cardsTop: number;
}

export interface CanvasSectionBlock {
  key: string;
  title: string;
  /** World-space x where this section begins (sections sit side-by-side). */
  x: number;
  /** Underlined title bar; absent when the section has no visible title. */
  titleY: number | null;
  headerY: number;
  cardsTop: number;
  columns: CanvasColumn[];
  /** World-space y just past the section's last round (its own round count). */
  bottom: number;
  /** Total width spanned by this section's cards (including edit-mode + Match button). */
  width: number;
}

export interface CanvasConnector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Y of the first horizontal segment (its corridor lane). Unique per lane so
   *  parallel lines never stack on one y. */
  laneCoord: number;
  /** Which outcome this line carries — winner lines are green, loser lines red. */
  cls: 'winner' | 'loser';
  /** True once the source match has a recorded winner: solid line anchored to
   *  the advancing/eliminated team's port instead of a dashed line from the
   *  card's center. */
  decided: boolean;
  /** Orthogonal polyline the renderer traces (corners get rounded). Every
   *  segment runs inside a corridor (gap between rounds) or a band (gap
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
  /** Edit-mode "+ Match" buttons, one per round row. */
  addMatchButtons: CanvasButton[];
  /** Edit-mode "+ Round" buttons, one per section (round = the next round number). */
  addRoundButtons: CanvasButton[];
}

// ─── Horizontal centers (position within a round) ────────────────────────────

/**
 * Assigns horizontal centers to all matches via row-by-row compaction.
 *
 * Each section's rounds are processed top to bottom; within a round, matches
 * (in `position` order) are placed at the average of their input centers, but
 * never left of the previous card plus the minimum gap. `position` values only
 * determine ordering, never absolute offsets — sparse or 1-indexed positions
 * (e.g. after bye compaction) don't leave holes in the row.
 *
 * Only same-section inputs pull on a match's center: sections are placed
 * side-by-side and normalized independently, so a cross-section reference (a
 * losers-bracket drop) must not drag the destination section's geometry around.
 */
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

  // Normalize each section so its leftmost card sits flush with the section's
  // card area even when every first-round match was pulled by inputs.
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

// ─── Slot resolution ─────────────────

/**
 * Resolves a slot to its actual team by recursively following winner/loser chains.
 * Returns a placeholder when the source match has not yet been played.
 */
export function resolveSlot(
  slot: BracketSlotFlex,
  teams: BracketTeamFlex[],
  allMatches: FlexBracketMatch[],
  matchLabels?: Map<string, string>,
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
      return resolveSlot(
        advancingSlot,
        teams,
        allMatches,
        matchLabels,
        depth + 1,
      );
    }
    return {
      team: null,
      placeholder: `Winner of ${matchLabels?.get(slot.from) ?? slot.from}`,
    };
  }

  if (slot.type === 'loser') {
    const src = allMatches.find((m) => m.id === slot.from);
    if (src?.winner !== undefined) {
      const eliminatedSlot = src.winner === 0 ? src.b : src.a;
      return resolveSlot(
        eliminatedSlot,
        teams,
        allMatches,
        matchLabels,
        depth + 1,
      );
    }
    return {
      team: null,
      placeholder: `Loser of ${matchLabels?.get(slot.from) ?? slot.from}`,
    };
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
  const isLosers = sectionKey === 'losers';
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
      const slots = Math.pow(2, fromEnd + 1);
      const roundOf = totalTeams > 0 ? Math.min(slots, totalTeams) : slots;
      return `Round of ${roundOf}`;
    }
    if (isLosers) {
      // Losers rounds alternate sizes instead of halving, so earlier rounds
      // stay numbered — only the last two get end-anchored names.
      if (fromEnd === 0) return 'Finals';
      if (fromEnd === 1) return 'Semi-Finals';
      return `Round ${idx + 1}`;
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
 * round rows, match card rects, connector line endpoints, and edit-mode
 * button rects. Pure — no DOM, no canvas.
 *
 * Rounds flow top-to-bottom: the round axis is y, matches within a round
 * spread out along x. Multi-section brackets (double-elim's winners/losers/
 * finals) sit side-by-side along x, sharing one global y-grid so cross-
 * section drop routes stay aligned and card-free — mirroring the old
 * left-to-right engine's shared x-grid across vertically-stacked sections.
 */
export function computeBracketLayout(
  data: FlexBracketData,
  editable: boolean,
): CanvasLayout {
  const { teams, matches, sections: sectionCfgs } = data;
  // Certified-random builder drafts (and read-only brackets served without a
  // team list) have no teams bound, but the seeds wired into the matches still
  // give the bracket size for "Round of N" titles.
  const maxSlotSeed = matches.reduce((mx, m) => {
    for (const slot of [m.a, m.b]) {
      if (slot.type === 'seed' || slot.type === 'bye') {
        mx = Math.max(mx, slot.seed);
      }
    }
    return mx;
  }, 0);
  const totalTeams = Math.max(teams.length, maxSlotSeed);
  // Rows grow to fit logo + coach when real teams are bound; placeholder-only
  // brackets (builder drafts, unseeded) stay compact.
  const teamH = teams.length > 0 ? TEAM_H_FULL : TEAM_H_COMPACT;
  const matchH = matchHeight(teamH);
  const positionCenters = computePositionCenters(matches, COL_W);
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

  // Labels must exist before slot resolution so a pending slot can render
  // "Winner of <label>" even when its source match lays out later.
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

  // ── Connector routing ──────────────────────────────────────────────────────
  // Classify every winner/loser edge before any geometry exists, so corridors
  // (horizontal gaps between round rows) and bands (vertical gaps between
  // sections) can size themselves to the number of lines they carry.
  //
  // - straight/elbow: same section, next round — the classic bracket line
  //   through the corridor between the two rounds.
  // - bus: everything else (cross-section drops, round skips, backward
  //   links). Routed out of the source into the corridor below its round,
  //   horizontally to the band left/right of the destination's section,
  //   vertically to the corridor above the destination round, then to the
  //   destination card. Every segment runs inside a corridor or a band, so
  //   bus lines never cross cards. Rounds share one y-grid across all
  //   sections, which keeps corridors card-free over the full canvas width.
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
    /** Section index whose band carries the vertical run (bus only). */
    bandSection: number;
    bandLane: number;
  }

  /** Section-relative x offset of a team row's connector port, from the
   *  section-relative match position-center. The two ports split the card's
   *  width so a decided match's line still visibly anchors to the advancing
   *  (or eliminated) team, even though the card isn't rotated. */
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
      const decided = src.winner !== undefined;

      const x1Rel = decided
        ? relPortOffset(
            src.id,
            raw.type === 'winner' ? src.winner! : ((1 - src.winner!) as 0 | 1),
          )
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

  // Lane bookkeeping: bus lines get globally unique lanes per corridor (their
  // horizontal runs can span several sections), while elbow lanes are unique
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

  // Corridor i sits above round-row i; its height grows with its lane count.
  // Corridor 0 (top canvas margin) collapses to zero when unused.
  const corridorH = (c: number): number => {
    const lanes = laneTotals.get(c) ?? 0;
    const needed = lanes > 0 ? 2 * CORRIDOR_PAD + (lanes - 1) * LANE_STEP : 0;
    return c === 0 ? needed : Math.max(COL_GAP, needed);
  };

  // Whether ANY section carries a title determines a uniform title band
  // reserved above round 0 for every section — the round axis (y) must stay
  // aligned across sections for cross-section bus routing, so this space
  // can't vary per section even when only some sections show title text.
  const sectionTitleOf = (sKey: string): string =>
    sectionCfgs?.find((s) => s.key === sKey)?.title ?? autoSectionTitle(sKey);
  const hasAnyTitle = sectionKeys.some((sKey) => !!sectionTitleOf(sKey));
  const titleBandH = hasAnyTitle ? SECTION_TITLE_H + SECTION_TITLE_GAP : 0;

  // Global round-axis (y) grid, shared by every section. Round i's header
  // sits just above its cards; a corridor (sized to the lanes routing
  // through it) sits above that header.
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
    return headerTop(c) - h + (h - (lanes - 1) * LANE_STEP) / 2 + lane * LANE_STEP;
  };

  // Vertical band runs share a lane when their y-spans don't overlap (greedy
  // interval coloring), keeping band widths reasonable.
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
      sKey,
      totalTeams,
      cfg?.roundTitles,
    );

    const title = cfg?.title ?? autoSectionTitle(sKey);
    const sectionX = xCursor;
    const titleY: number | null = title ? 0 : null;

    const columns: CanvasColumn[] = [];
    let maxCardRight = sectionX + COL_W; // sections render at least one card wide

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
            { raw: m.a, ...resolvedA, status: slotStatus(m.winner, 0) },
            { raw: m.b, ...resolvedB, status: slotStatus(m.winner, 1) },
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

  /** Center x of a band lane (the vertical run of a bus route). */
  const bandLaneX = (s: number, lane: number): number => {
    const lanes = bandLaneCount.get(s) ?? 1;
    return (
      bandLefts[s] +
      (bandWidths[s] - (lanes - 1) * LANE_STEP) / 2 +
      lane * LANE_STEP
    );
  };

  // Connector endpoints: source card's bottom edge at its horizontal port →
  // destination slot's top edge at the port's horizontal position.
  const matchLayoutById = new Map(layoutMatches.map((m) => [m.id, m]));
  const connectors: CanvasConnector[] = [];
  const routeByConnector: ConnectorRoute[] = [];

  for (const r of routes) {
    const src = matchLayoutById.get(r.fromId);
    const dest = matchLayoutById.get(r.destId);
    if (!src || !dest) continue;

    // Undecided: line leaves from the card's horizontal center. Decided: it
    // leaves from the port of the team actually advancing (or eliminated).
    let x1 = src.x + src.w / 2;
    if (r.decided) {
      const sourceMatch = matchById.get(r.fromId)!;
      const rowIndex: 0 | 1 =
        r.cls === 'winner'
          ? sourceMatch.winner!
          : ((1 - sourceMatch.winner!) as 0 | 1);
      x1 = src.portX[rowIndex];
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

  // Fan out lines that leave the same point (e.g. an undecided match feeding
  // both a winner and a loser slot) so they don't overlap at the origin.
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

  // Trace each route into its final polyline.
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
      // A bus whose out- and in-corridors coincide (cross-section, next
      // round) degenerates to a single horizontal run straight through the band.
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
