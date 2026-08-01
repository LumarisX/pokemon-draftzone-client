// ─── Connector routing over measured geometry ────────────────────────────────
//
// The builder lays its cards out with CSS, so unlike the old canvas engine this
// does not decide where anything sits — it is handed the measured rects and
// only works out how to draw between them.
//
// Two kinds of empty space carry the lines, and every segment stays inside one
// of them so a wire never crosses a card:
//
//   corridor i — the horizontal strip above round row i (the gap between the
//                previous row's cards and this row's).
//   band s     — the vertical strip to the left of section s.
//
// Within a corridor or band, parallel lines are separated into *lanes*. Lanes
// are assigned before any point is placed, which is what lets several wires
// share a corridor without stacking on one another.

import { FlexBracketMatch } from '../league-bracket/bracket.model';

/** Spacing between parallel lines sharing a corridor or band. */
export const LANE_STEP = 6;
/** Clearance kept between the outermost lane and the cards on either side. */
export const LANE_PAD = 10;

export interface WireRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Vertical extent of one round row, in the same space as the card rects. */
export interface RowBand {
  top: number;
  bottom: number;
}

/** Horizontal extent of the empty strip left of a section. */
export interface SectionBand {
  key: string;
  left: number;
  right: number;
}

export interface WireGeometry {
  /** Measured card rects by match id. Matches without one are skipped. */
  rects: Map<string, WireRect>;
  /** Indexed by global round. */
  rows: RowBand[];
  /** In left-to-right order; index is the section's column position. */
  bands: SectionBand[];
}

export interface Wire {
  fromId: string;
  toId: string;
  slotIndex: 0 | 1;
  cls: 'winner' | 'loser';
  /** True once the source has a result: the line anchors to the team it carries. */
  decided: boolean;
  points: { x: number; y: number }[];
}

type RouteKind = 'straight' | 'elbow' | 'bus';

interface Route {
  fromId: string;
  toId: string;
  slotIndex: 0 | 1;
  cls: 'winner' | 'loser';
  decided: boolean;
  kind: RouteKind;
  srcSection: string;
  /** Corridor carrying the segment leaving the source. */
  corrOut: number;
  laneOut: number;
  /** Corridor carrying the segment entering the destination (bus only). */
  corrIn: number;
  laneIn: number;
  /** Index of the band carrying the vertical run (bus only). */
  bandIndex: number;
  bandLane: number;
}

const sectionOf = (m: FlexBracketMatch): string => m.section ?? 'main';

/** Where a wire meets a card: the two slots split the card's width. */
export function portX(rect: WireRect, slotIndex: 0 | 1): number {
  return rect.x + rect.w * (slotIndex === 0 ? 0.3 : 0.7);
}

/**
 * Minimum height a corridor needs to hold `lanes` parallel lines. The builder
 * feeds this back into the row gap so wires always have room, rather than the
 * router quietly overlapping them.
 */
export function requiredCorridorHeight(lanes: number): number {
  return lanes > 0 ? 2 * LANE_PAD + (lanes - 1) * LANE_STEP : 0;
}

/**
 * Classifies every winner/loser edge and assigns its lanes.
 *
 * Split out from `computeWires` because the lane counts are what the builder
 * needs *before* layout — a corridor has to be tall enough for the lines it
 * will carry, and that is a CSS gap, not something this module controls.
 */
export function planRoutes(matches: FlexBracketMatch[]): {
  routes: Route[];
  /** Lanes per corridor index, for sizing the gaps above each row. */
  corridorLanes: Map<number, number>;
} {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const sectionOrder = [...new Set(matches.map(sectionOf))];
  const sectionIndex = new Map(sectionOrder.map((key, i) => [key, i] as const));

  const routes: Route[] = [];
  for (const dest of matches) {
    [dest.a, dest.b].forEach((slot, index) => {
      if (slot.type !== 'winner' && slot.type !== 'loser') return;
      const src = byId.get(slot.from);
      if (!src) return;

      const srcSection = sectionOf(src);
      const destSection = sectionOf(dest);
      // The classic bracket line: same section, straight into the next round.
      const adjacent =
        srcSection === destSection && dest.round === src.round + 1;

      routes.push({
        fromId: src.id,
        toId: dest.id,
        slotIndex: index as 0 | 1,
        cls: slot.type,
        decided: src.winner !== undefined,
        // Whether an adjacent route is a straight drop or an elbow depends on
        // the measured x of both ports, so it is settled in computeWires.
        kind: adjacent ? 'elbow' : 'bus',
        srcSection,
        corrOut: src.round + 1,
        laneOut: 0,
        corrIn: dest.round,
        laneIn: 0,
        bandIndex: sectionIndex.get(destSection) ?? 0,
        bandLane: 0,
      });
    });
  }

  // Bus lines run horizontally across several sections, so their lanes are
  // unique across the whole corridor. Elbows stay inside one section, so they
  // may reuse lane numbers between sections — offset past the bus lanes.
  const busLanes = new Map<number, number>();
  for (const r of routes) {
    if (r.kind !== 'bus') continue;
    busLanes.set(r.corrOut, (busLanes.get(r.corrOut) ?? 0) + 1);
    if (r.corrIn !== r.corrOut)
      busLanes.set(r.corrIn, (busLanes.get(r.corrIn) ?? 0) + 1);
  }

  const busCursor = new Map<number, number>();
  const takeBusLane = (corridor: number): number => {
    const lane = busCursor.get(corridor) ?? 0;
    busCursor.set(corridor, lane + 1);
    return lane;
  };
  const elbowCursor = new Map<string, number>();

  for (const r of routes) {
    if (r.kind === 'bus') {
      r.laneOut = takeBusLane(r.corrOut);
      r.laneIn = r.corrIn === r.corrOut ? r.laneOut : takeBusLane(r.corrIn);
    } else {
      const key = `${r.corrOut}::${r.srcSection}`;
      const index = elbowCursor.get(key) ?? 0;
      elbowCursor.set(key, index + 1);
      r.laneOut = (busLanes.get(r.corrOut) ?? 0) + index;
    }
  }

  const corridorLanes = new Map(busLanes);
  for (const [key, count] of elbowCursor) {
    const corridor = Number(key.split('::')[0]);
    corridorLanes.set(
      corridor,
      Math.max(
        corridorLanes.get(corridor) ?? 0,
        (busLanes.get(corridor) ?? 0) + count,
      ),
    );
  }

  return { routes, corridorLanes };
}

/**
 * Traces every connector into an orthogonal polyline over the measured layout.
 *
 * Matches whose card was not measured (a section collapsed, a row scrolled out
 * of a virtualised list) are dropped rather than drawn to a guessed position.
 */
export function computeWires(
  matches: FlexBracketMatch[],
  geometry: WireGeometry,
): Wire[] {
  const { rects, rows, bands } = geometry;
  const { routes, corridorLanes } = planRoutes(matches);
  const byId = new Map(matches.map((m) => [m.id, m]));

  /**
   * Centre of a lane inside corridor `index`. The corridor is the measured gap
   * between two rows; lanes are spread evenly about its middle. Corridor 0 sits
   * above the first row and corridor `rows.length` below the last.
   */
  const laneY = (corridor: number, lane: number): number => {
    const above = rows[corridor - 1];
    const below = rows[corridor];
    const top = above ? above.bottom : (below?.top ?? 0) - 2 * LANE_PAD;
    const bottom = below ? below.top : (above?.bottom ?? 0) + 2 * LANE_PAD;
    const lanes = corridorLanes.get(corridor) ?? 1;
    const span = (lanes - 1) * LANE_STEP;
    return (top + bottom) / 2 - span / 2 + lane * LANE_STEP;
  };

  // Vertical runs share a lane whenever their y-spans don't overlap (greedy
  // interval colouring), so a band stays narrow no matter how many wires cross.
  const bandLaneCount = new Map<number, number>();
  {
    const runs = routes
      .filter((r) => r.kind === 'bus' && r.corrIn !== r.corrOut)
      .map((r) => {
        const a = laneY(r.corrOut, r.laneOut);
        const b = laneY(r.corrIn, r.laneIn);
        return { route: r, lo: Math.min(a, b), hi: Math.max(a, b) };
      })
      .sort((a, b) => a.lo - b.lo || a.hi - b.hi);

    const endsByBand = new Map<number, number[]>();
    for (const run of runs) {
      const ends = endsByBand.get(run.route.bandIndex) ?? [];
      let lane = ends.findIndex((end) => run.lo >= end + LANE_STEP);
      if (lane === -1) {
        lane = ends.length;
        ends.push(run.hi);
      } else {
        ends[lane] = run.hi;
      }
      endsByBand.set(run.route.bandIndex, ends);
      run.route.bandLane = lane;
      bandLaneCount.set(run.route.bandIndex, ends.length);
    }
  }

  const bandX = (index: number, lane: number): number => {
    const band = bands[index];
    if (!band) return 0;
    const lanes = bandLaneCount.get(index) ?? 1;
    const span = (lanes - 1) * LANE_STEP;
    return (band.left + band.right) / 2 - span / 2 + lane * LANE_STEP;
  };

  const wires: Wire[] = [];
  for (const route of routes) {
    const srcRect = rects.get(route.fromId);
    const destRect = rects.get(route.toId);
    if (!srcRect || !destRect) continue;

    const src = byId.get(route.fromId)!;
    // Undecided lines leave from the middle of the card; once a result is in,
    // the line leaves the row of the team it actually carries.
    let x1 = srcRect.x + srcRect.w / 2;
    if (route.decided) {
      const row: 0 | 1 =
        route.cls === 'winner'
          ? src.winner!
          : ((1 - src.winner!) as 0 | 1);
      x1 = portX(srcRect, row);
    }
    const y1 = srcRect.y + srcRect.h;
    const x2 = portX(destRect, route.slotIndex);
    const y2 = destRect.y;

    const points = tracePoints(route, { x1, y1, x2, y2 }, laneY, bandX);
    wires.push({
      fromId: route.fromId,
      toId: route.toId,
      slotIndex: route.slotIndex,
      cls: route.cls,
      decided: route.decided,
      points,
    });
  }

  // Two wires leaving the same point (an undecided match feeding both a winner
  // and a loser slot) would overlap at the origin; fan them apart.
  const byOrigin = new Map<string, Wire[]>();
  for (const wire of wires) {
    const origin = wire.points[0];
    const key = `${Math.round(origin.x)}:${Math.round(origin.y)}`;
    byOrigin.set(key, [...(byOrigin.get(key) ?? []), wire]);
  }
  for (const group of byOrigin.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.points[a.points.length - 1].x - b.points[b.points.length - 1].x);
    const spread = Math.min(12, LANE_STEP * 2);
    group.forEach((wire, i) => {
      const shift = (i - (group.length - 1) / 2) * spread;
      wire.points[0] = { ...wire.points[0], x: wire.points[0].x + shift };
      if (wire.points.length > 2)
        wire.points[1] = { ...wire.points[1], x: wire.points[1].x + shift };
    });
  }

  return wires;
}

function tracePoints(
  route: Route,
  ends: { x1: number; y1: number; x2: number; y2: number },
  laneY: (corridor: number, lane: number) => number,
  bandX: (index: number, lane: number) => number,
): { x: number; y: number }[] {
  const { x1, y1, x2, y2 } = ends;

  // Ports already aligned: a plain vertical drop, no corridor detour needed.
  if (route.kind !== 'bus' && Math.abs(x2 - x1) < 1) {
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }

  // One horizontal run through a single corridor: the classic bracket elbow,
  // and also a cross-section hop that happens to land in the next round.
  if (route.kind !== 'bus' || route.corrIn === route.corrOut) {
    const y = laneY(route.corrOut, route.laneOut);
    return [
      { x: x1, y: y1 },
      { x: x1, y },
      { x: x2, y },
      { x: x2, y: y2 },
    ];
  }

  // Full bus: out into a corridor, sideways to the destination section's band,
  // vertically to the corridor above the destination, then in.
  const yOut = laneY(route.corrOut, route.laneOut);
  const yIn = laneY(route.corrIn, route.laneIn);
  const x = bandX(route.bandIndex, route.bandLane);
  return [
    { x: x1, y: y1 },
    { x: x1, y: yOut },
    { x, y: yOut },
    { x, y: yIn },
    { x: x2, y: yIn },
    { x: x2, y: y2 },
  ];
}
