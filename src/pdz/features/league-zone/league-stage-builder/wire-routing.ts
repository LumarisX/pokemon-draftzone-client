// ─── Connector routing over measured geometry ────────────────────────────────
//
// The builder lays its cards out with CSS, so unlike the old canvas engine this
// does not decide where anything sits — it is handed the measured rects and
// only works out how to draw between them.
//
// Two kinds of empty space carry the lines:
//
//   corridor i — the horizontal strip above round row i (the gap between the
//                previous row's cards and this row's).
//   band s     — the vertical strip to the left of stage s.
//
// A wire takes the direct route wherever it can: straight down out of the
// middle of the source card, one turn in the corridor above the destination,
// then straight down into it. Turning as late as possible is the point — the
// long run belongs to the card the line leaves, which is what says where a team
// is going.
//
// The band is the exception, not the rule. A wire only detours out to one when
// a card measurably sits in the way of that straight drop; a wire crossing
// rounds that happen to be empty in its own column has nothing to avoid, and
// sending it out to an empty column and back read as a detour rather than as a
// connection.
//
// Within a corridor or band, parallel lines are separated into *lanes* a few
// pixels apart. Two whose runs do not overlap share one, so neither grows for
// lines that never had to pass each other.

import { FlexBracketMatch } from '../league-bracket/bracket.model';

/** Spacing between parallel lines sharing a corridor or band. */
export const LANE_STEP = 6;
/** Clearance kept between the outermost lane and the cards on either side. */
export const LANE_PAD = 10;
/**
 * How far apart two lines meeting the same card edge are held.
 *
 * Every wire enters and leaves through the middle of a card's top or bottom
 * edge, so the only thing keeping a pair from being drawn on top of one another
 * is this offset — it is meant to be just enough to tell them apart, not enough
 * to read as "this line belongs to that side of the card".
 */
export const PORT_SPREAD = 12;
/** Slack allowed either side of a card when asking whether it blocks a drop. */
const BLOCK_CLEARANCE = 2;

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

/** Horizontal extent of the empty strip left of a stage. */
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
  /** Keyed by stage; looked up by key, never by position. */
  bands: SectionBand[];
}

export interface Wire {
  fromId: string;
  toId: string;
  slotIndex: 0 | 1;
  cls: 'winner' | 'loser';
  /** True once the source has a result. Only affects how the line is drawn. */
  decided: boolean;
  points: { x: number; y: number }[];
}

export interface Route {
  fromId: string;
  toId: string;
  slotIndex: 0 | 1;
  cls: 'winner' | 'loser';
  decided: boolean;
  /** Round the source sits in, for working out what lies between the two. */
  srcRound: number;
  /** Corridor the run entering the destination travels in. */
  corridor: number;
  /** Corridor a detoured wire leaves its source through. */
  exitCorridor: number;
  /**
   * Stage whose band a detoured wire runs down.
   *
   * Held as the stage's own key rather than its position in a list: the bands
   * are measured in the order the grid stacks its stages, which is by
   * `stage.order`, and nothing makes the matches arrive in that order.
   */
  bandKey: string;
}

export interface WireLayout {
  wires: Wire[];
  /**
   * Lanes each corridor ended up needing. The builder sizes the gap between
   * rows from this: a corridor too short for its lanes does not clip them, it
   * spreads them onto the cards either side.
   */
  corridorLanes: Map<number, number>;
}

/** Both ends of one wire, before it is turned into a polyline. */
interface Endpoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const sectionOf = (m: FlexBracketMatch): string => m.section ?? 'main';

/**
 * Where a wire meets a card: both slots sit either side of its middle.
 *
 * The two ports used to be out at the card's quarters, which put a line's
 * attachment point somewhere the card itself says nothing about — the slots are
 * stacked rows, not left and right halves. Kept together at the middle instead,
 * a wire leaves and arrives on a long vertical run, and the direction it is
 * travelling is what reads.
 */
export function portX(rect: WireRect, slotIndex: 0 | 1): number {
  const middle = rect.x + rect.w / 2;
  return middle + (slotIndex === 0 ? -PORT_SPREAD / 2 : PORT_SPREAD / 2);
}

/**
 * Minimum height a corridor needs to hold `lanes` parallel lines. The builder
 * feeds this back into the row gap so wires always have room, rather than the
 * router quietly overlapping them.
 */
export function requiredCorridorHeight(lanes: number): number {
  return lanes > 0 ? 2 * LANE_PAD + (lanes - 1) * LANE_STEP : 0;
}

/** Every winner/loser edge, and the corridors it could use. */
export function planRoutes(matches: FlexBracketMatch[]): Route[] {
  const byId = new Map(matches.map((m) => [m.id, m]));

  const routes: Route[] = [];
  for (const dest of matches) {
    [dest.a, dest.b].forEach((slot, index) => {
      if (slot.type !== 'winner' && slot.type !== 'loser') return;
      const src = byId.get(slot.from);
      if (!src) return;

      routes.push({
        fromId: src.id,
        toId: dest.id,
        slotIndex: index as 0 | 1,
        cls: slot.type,
        decided: src.winner !== undefined,
        srcRound: src.round,
        corridor: dest.round,
        exitCorridor: src.round + 1,
        bandKey: sectionOf(dest),
      });
    });
  }
  return routes;
}

/**
 * Traces every connector into an orthogonal polyline over the measured layout.
 *
 * Matches whose card was not measured (a stage collapsed, a row scrolled out of
 * a virtualised list) are dropped rather than drawn to a guessed position.
 */
export function computeWires(
  matches: FlexBracketMatch[],
  geometry: WireGeometry,
): WireLayout {
  const { rects, rows, bands } = geometry;
  const routes = planRoutes(matches).filter(
    (route) => rects.has(route.fromId) && rects.has(route.toId),
  );

  const ends = placeEndpoints(routes, rects);
  const bandByKey = new Map(bands.map((band) => [band.key, band]));
  const bandMiddle = (key: string): number => {
    const band = bandByKey.get(key);
    return band ? (band.left + band.right) / 2 : 0;
  };

  // Every card that could stand between a source and its destination, with the
  // round it sits in — which is what decides whether a straight drop is clear.
  const cards = matches
    .filter((match) => rects.has(match.id))
    .map((match) => ({ round: match.round, rect: rects.get(match.id)! }));

  const detoured = new Set(
    routes.filter((route) => isBlocked(route, ends.get(route)!, cards)),
  );

  // Corridor lanes come first: a band lane is chosen from the *heights* two
  // runs connect, so those heights have to be settled before it can be.
  const { lane, corridorLanes } = assignCorridorLanes(
    routes,
    ends,
    detoured,
    bandMiddle,
  );

  /**
   * Centre of a lane inside corridor `index`. The corridor is the measured gap
   * between two rows; lanes are spread evenly about its middle. Corridor 0 sits
   * above the first row and corridor `rows.length` below the last.
   */
  const laneY = (corridor: number, index: number): number => {
    const above = rows[corridor - 1];
    const below = rows[corridor];
    const top = above ? above.bottom : (below?.top ?? 0) - 2 * LANE_PAD;
    const bottom = below ? below.top : (above?.bottom ?? 0) + 2 * LANE_PAD;
    const lanes = corridorLanes.get(corridor) ?? 1;
    const span = (lanes - 1) * LANE_STEP;
    return (top + bottom) / 2 - span / 2 + index * LANE_STEP;
  };

  const bandX = assignBandLanes([...detoured], laneY, lane, bandByKey);

  const wires = routes.map((route) => {
    const endpoints = ends.get(route)!;
    const yIn = laneY(route.corridor, lane.get(route)?.in ?? 0);

    if (detoured.has(route)) {
      const yOut = laneY(route.exitCorridor, lane.get(route)!.out!);
      return wire(route, traceDetour(endpoints, yOut, yIn, bandX(route)));
    }
    return wire(
      route,
      traceDirect(endpoints, isStraight(endpoints) ? null : yIn),
    );
  });

  return { wires, corridorLanes };
}

function wire(route: Route, points: { x: number; y: number }[]): Wire {
  return {
    fromId: route.fromId,
    toId: route.toId,
    slotIndex: route.slotIndex,
    cls: route.cls,
    decided: route.decided,
    points,
  };
}

/**
 * Fixes both ends of every wire.
 *
 * Every line leaves from the same point — the middle of the source's bottom
 * edge — so a match feeding both a winner and a loser slot would send the two
 * out on top of each other. The pair is fanned apart here, before anything is
 * traced: shifting a finished polyline instead would leave the straight-drop
 * case, which is only two points, with a start that no longer sits under its
 * own run.
 */
function placeEndpoints(
  routes: Route[],
  rects: Map<string, WireRect>,
): Map<Route, Endpoints> {
  const shift = new Map<Route, number>();
  const bySource = new Map<string, Route[]>();
  for (const route of routes) {
    bySource.set(route.fromId, [...(bySource.get(route.fromId) ?? []), route]);
  }
  for (const group of bySource.values()) {
    if (group.length < 2) continue;
    // Left-to-right by where each line is headed, so the two never cross each
    // other on the way out.
    group.sort(
      (a, b) =>
        portX(rects.get(a.toId)!, a.slotIndex) -
        portX(rects.get(b.toId)!, b.slotIndex),
    );
    group.forEach((route, index) => {
      shift.set(route, (index - (group.length - 1) / 2) * PORT_SPREAD);
    });
  }

  const ends = new Map<Route, Endpoints>();
  for (const route of routes) {
    const srcRect = rects.get(route.fromId)!;
    const destRect = rects.get(route.toId)!;
    ends.set(route, {
      x1: srcRect.x + srcRect.w / 2 + (shift.get(route) ?? 0),
      y1: srcRect.y + srcRect.h,
      x2: portX(destRect, route.slotIndex),
      y2: destRect.y,
    });
  }
  return ends;
}

/**
 * Whether a card stands in the way of the wire's straight drop.
 *
 * Only the rounds strictly between the two matter: the drop starts at the
 * source's bottom edge and stops in the corridor above the destination's row,
 * so neither of those rows can be in its path. Rounds a stage does not reach
 * are simply empty here, which is what lets a wire crossing them fall straight
 * rather than routing around cards that are not there.
 */
function isBlocked(
  route: Route,
  { x1 }: Endpoints,
  cards: { round: number; rect: WireRect }[],
): boolean {
  return cards.some(
    ({ round, rect }) =>
      round > route.srcRound &&
      round < route.corridor &&
      x1 > rect.x - BLOCK_CLEARANCE &&
      x1 < rect.x + rect.w + BLOCK_CLEARANCE,
  );
}

/**
 * Packs the horizontal runs sharing a corridor into as few lanes as possible.
 *
 * Greedy interval colouring over the runs' horizontal extents: two that do not
 * overlap can sit at the same height without touching, so a corridor only grows
 * for lines that genuinely have to pass one another. A detoured wire has two
 * such runs — one leaving its source, one entering its destination — and takes
 * a lane in each.
 */
function assignCorridorLanes(
  routes: Route[],
  ends: Map<Route, Endpoints>,
  detoured: Set<Route>,
  bandMiddle: (key: string) => number,
): {
  lane: Map<Route, { in: number; out?: number }>;
  corridorLanes: Map<number, number>;
} {
  /** One horizontal run wanting a lane in one corridor. */
  interface Run {
    route: Route;
    corridor: number;
    leg: 'in' | 'out';
    lo: number;
    hi: number;
  }

  const runs: Run[] = [];
  for (const route of routes) {
    const { x1, x2 } = ends.get(route)!;
    if (detoured.has(route)) {
      // The lane offset within a band is a handful of pixels, far below what
      // could change whether two runs overlap, so its middle stands in for it
      // here — the band's own lanes are not assigned until later.
      const x = bandMiddle(route.bandKey);
      runs.push({
        route,
        corridor: route.exitCorridor,
        leg: 'out',
        lo: Math.min(x1, x),
        hi: Math.max(x1, x),
      });
      runs.push({
        route,
        corridor: route.corridor,
        leg: 'in',
        lo: Math.min(x, x2),
        hi: Math.max(x, x2),
      });
    } else if (!isStraight(ends.get(route)!)) {
      runs.push({
        route,
        corridor: route.corridor,
        leg: 'in',
        lo: Math.min(x1, x2),
        hi: Math.max(x1, x2),
      });
    }
    // A straight drop never enters a corridor, so it takes no lane at all.
  }

  const lane = new Map<Route, { in: number; out?: number }>();
  const corridorLanes = new Map<number, number>();

  const byCorridor = new Map<number, Run[]>();
  for (const run of runs) {
    byCorridor.set(run.corridor, [...(byCorridor.get(run.corridor) ?? []), run]);
  }

  for (const [corridor, group] of byCorridor) {
    /** Right-hand end of the last run placed in each lane. */
    const occupied: number[] = [];
    for (const run of [...group].sort((a, b) => a.lo - b.lo || a.hi - b.hi)) {
      let index = occupied.findIndex((end) => run.lo >= end + LANE_STEP);
      if (index === -1) {
        index = occupied.length;
        occupied.push(run.hi);
      } else {
        occupied[index] = run.hi;
      }
      const entry = lane.get(run.route) ?? { in: 0 };
      lane.set(run.route, { ...entry, [run.leg]: index });
    }
    corridorLanes.set(corridor, occupied.length);
  }

  return { lane, corridorLanes };
}

/**
 * Packs the vertical runs sharing a band, the same way but on the other axis:
 * two whose heights do not overlap sit at the same x, so a band stays narrow no
 * matter how many wires cross it.
 */
function assignBandLanes(
  detoured: Route[],
  laneY: (corridor: number, index: number) => number,
  lane: Map<Route, { in: number; out?: number }>,
  bandByKey: Map<string, SectionBand>,
): (route: Route) => number {
  const runs = detoured
    .map((route) => {
      const a = laneY(route.exitCorridor, lane.get(route)!.out!);
      const b = laneY(route.corridor, lane.get(route)!.in);
      return { route, lo: Math.min(a, b), hi: Math.max(a, b) };
    })
    .sort((a, b) => a.lo - b.lo || a.hi - b.hi);

  const bandLane = new Map<Route, number>();
  const laneCount = new Map<string, number>();
  const endsByBand = new Map<string, number[]>();
  for (const run of runs) {
    const occupied = endsByBand.get(run.route.bandKey) ?? [];
    let index = occupied.findIndex((end) => run.lo >= end + LANE_STEP);
    if (index === -1) {
      index = occupied.length;
      occupied.push(run.hi);
    } else {
      occupied[index] = run.hi;
    }
    endsByBand.set(run.route.bandKey, occupied);
    bandLane.set(run.route, index);
    laneCount.set(run.route.bandKey, occupied.length);
  }

  return (route: Route): number => {
    const band = bandByKey.get(route.bandKey);
    if (!band) return 0;
    const lanes = laneCount.get(route.bandKey) ?? 1;
    const span = (lanes - 1) * LANE_STEP;
    return (
      (band.left + band.right) / 2 -
      span / 2 +
      (bandLane.get(route) ?? 0) * LANE_STEP
    );
  };
}

/**
 * Near enough to aligned to skip the corridor entirely.
 *
 * The tolerance is a whole port spread rather than a rounding epsilon because
 * both ends attach beside the middle of their card, so two cards sitting one
 * above the other differ by only a few pixels. Honouring that drew a step —
 * down, a hair sideways, down again — where the eye expects one straight line.
 */
function isStraight({ x1, x2 }: Endpoints): boolean {
  return Math.abs(x2 - x1) <= PORT_SPREAD;
}

/** `y` is the height the wire turns at, or null for an unbroken drop. */
function traceDirect(
  { x1, y1, x2, y2 }: Endpoints,
  y: number | null,
): { x: number; y: number }[] {
  if (y === null) {
    return [
      { x: x2, y: y1 },
      { x: x2, y: y2 },
    ];
  }
  return [
    { x: x1, y: y1 },
    { x: x1, y },
    { x: x2, y },
    { x: x2, y: y2 },
  ];
}

/** Out into a corridor, sideways to the band, down it, then in. */
function traceDetour(
  { x1, y1, x2, y2 }: Endpoints,
  yOut: number,
  yIn: number,
  x: number,
): { x: number; y: number }[] {
  return [
    { x: x1, y: y1 },
    { x: x1, y: yOut },
    { x, y: yOut },
    { x, y: yIn },
    { x: x2, y: yIn },
    { x: x2, y: y2 },
  ];
}
