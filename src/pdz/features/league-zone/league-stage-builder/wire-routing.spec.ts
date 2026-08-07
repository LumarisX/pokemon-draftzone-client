import { FlexBracketMatch } from '../league-bracket/bracket.model';
import {
  computeWires,
  LANE_STEP,
  PORT_SPREAD,
  planRoutes,
  requiredCorridorHeight,
  WireGeometry,
  WireRect,
} from './wire-routing';

const CARD_W = 200;
const CARD_H = 80;
const ROW_H = 120;
const GAP = 60;

/** Row `i` occupies [i*(ROW_H+GAP), i*(ROW_H+GAP)+ROW_H]. */
const rowTop = (round: number) => round * (ROW_H + GAP);

const match = (
  id: string,
  round: number,
  position: number,
  over: Partial<FlexBracketMatch> = {},
): FlexBracketMatch => ({
  id,
  round,
  position,
  a: { type: 'seed', seed: 1 },
  b: { type: 'seed', seed: 2 },
  ...over,
});

/** Lays every match out on a simple grid: sections in columns, rounds in rows. */
function layout(matches: FlexBracketMatch[]): WireGeometry {
  const sections = [...new Set(matches.map((m) => m.section ?? 'main'))];
  const sectionWidth = 3 * CARD_W;
  const bandWidth = 40;

  const rects = new Map<string, WireRect>();
  for (const m of matches) {
    const sectionIndex = sections.indexOf(m.section ?? 'main');
    const sectionLeft = sectionIndex * (sectionWidth + bandWidth) + bandWidth;
    rects.set(m.id, {
      x: sectionLeft + m.position * (CARD_W + 20),
      y: rowTop(m.round),
      w: CARD_W,
      h: CARD_H,
    });
  }

  const roundCount = Math.max(...matches.map((m) => m.round)) + 1;
  return {
    rects,
    rows: Array.from({ length: roundCount }, (_, i) => ({
      top: rowTop(i),
      bottom: rowTop(i) + ROW_H,
    })),
    bands: sections.map((key, i) => ({
      key,
      left: i * (sectionWidth + bandWidth),
      right: i * (sectionWidth + bandWidth) + bandWidth,
    })),
  };
}

const segments = (points: { x: number; y: number }[]) =>
  points.slice(1).map((p, i) => ({ a: points[i], b: p }));

/** True when an axis-aligned segment passes through a card's interior. */
function crossesRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  rect: WireRect,
): boolean {
  const loX = Math.min(a.x, b.x);
  const hiX = Math.max(a.x, b.x);
  const loY = Math.min(a.y, b.y);
  const hiY = Math.max(a.y, b.y);
  // Shrink the card slightly: wires legitimately touch the edge they attach to.
  const pad = 1;
  return (
    hiX > rect.x + pad &&
    loX < rect.x + rect.w - pad &&
    hiY > rect.y + pad &&
    loY < rect.y + rect.h - pad
  );
}

describe('planRoutes', () => {
  it('turns every edge in the corridor above its destination', () => {
    const matches = [
      match('semi-a', 0, 0),
      match('semi-b', 0, 1),
      match('final', 1, 0, {
        a: { type: 'winner', from: 'semi-a' },
        b: { type: 'winner', from: 'semi-b' },
      }),
    ];
    const routes = planRoutes(matches);
    expect(routes.length).toBe(2);
    expect(routes.every((r) => r.corridor === 1)).toBe(true);
  });

  it('carries the destination section as the band it would detour through', () => {
    const matches = [
      match('w1', 0, 0, { section: 'winners' }),
      match('l1', 2, 0, {
        section: 'losers',
        a: { type: 'loser', from: 'w1' },
      }),
    ];
    const [route] = planRoutes(matches);
    expect(route.bandKey).toBe('losers');
    expect(route.srcRound).toBe(0);
    expect(route.exitCorridor).toBe(1);
    expect(route.corridor).toBe(2);
  });

  it('ignores a slot fed by a match that is not in the draft', () => {
    const matches = [match('a', 1, 0, { a: { type: 'winner', from: 'gone' } })];
    expect(planRoutes(matches)).toEqual([]);
  });

  it('sizes a corridor to the lines it carries', () => {
    expect(requiredCorridorHeight(0)).toBe(0);
    expect(requiredCorridorHeight(3)).toBe(20 + 2 * LANE_STEP);
  });
});

describe('computeWires', () => {
  it('drops a wire straight down when the ports already line up', () => {
    const matches = [
      match('src', 0, 0),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
    ];
    const geometry = layout(matches);
    // Align the source's exit with the destination's slot-A port.
    const destRect = geometry.rects.get('dest')!;
    const srcRect = geometry.rects.get('src')!;
    geometry.rects.set('src', {
      ...srcRect,
      x: destRect.x + destRect.w / 2 - PORT_SPREAD / 2 - srcRect.w / 2,
    });

    const { wires } = computeWires(matches, geometry);
    expect(wires[0].points.length).toBe(2);
  });

  it('elbows through the corridor between the two rows', () => {
    const matches = [
      match('src', 0, 1),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
    ];
    const { wires } = computeWires(matches, layout(matches));
    const [wire] = wires;
    expect(wire.points.length).toBe(4);
    const corridorY = wire.points[1].y;
    // The horizontal run sits in the gap, clear of both rows.
    expect(corridorY).toBeGreaterThan(rowTop(0) + ROW_H);
    expect(corridorY).toBeLessThan(rowTop(1));
    expect(wire.points[2].y).toBe(corridorY);
  });

  it('leaves the middle of the card whether or not the match is decided', () => {
    const matches = [
      match('src', 0, 0, { winner: 1 }),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
      match('drop', 1, 1, { a: { type: 'loser', from: 'src' } }),
    ];
    const { wires } = computeWires(matches, layout(matches));
    const srcRect = layout(matches).rects.get('src')!;
    const middle = srcRect.x + srcRect.w / 2;

    // A result no longer moves the exit onto the winning team's row: both lines
    // straddle the middle, far enough apart only to stay distinguishable.
    expect(wires.map((w) => w.points[0].x).sort((a, b) => a - b)).toEqual([
      middle - PORT_SPREAD / 2,
      middle + PORT_SPREAD / 2,
    ]);
  });

  it('arrives at the middle of the destination, one port per slot', () => {
    const matches = [
      match('semi-a', 0, 0),
      match('semi-b', 0, 1),
      match('final', 1, 0, {
        a: { type: 'winner', from: 'semi-a' },
        b: { type: 'winner', from: 'semi-b' },
      }),
    ];
    const { wires } = computeWires(matches, layout(matches));
    const destRect = layout(matches).rects.get('final')!;
    const middle = destRect.x + destRect.w / 2;

    const arrivals = wires.map((w) => w.points[w.points.length - 1].x);
    expect(arrivals.sort((a, b) => a - b)).toEqual([
      middle - PORT_SPREAD / 2,
      middle + PORT_SPREAD / 2,
    ]);
    // Each drops in vertically rather than running sideways into the edge.
    for (const wire of wires) {
      const last = wire.points[wire.points.length - 1];
      expect(wire.points[wire.points.length - 2].x).toBe(last.x);
    }
  });

  it('fans apart two lines leaving the same card', () => {
    const matches = [
      match('src', 0, 0),
      match('up', 1, 0, { a: { type: 'winner', from: 'src' } }),
      match('down', 1, 1, { a: { type: 'loser', from: 'src' } }),
    ];
    const { wires } = computeWires(matches, layout(matches));
    expect(wires[0].points[0].x).not.toBe(wires[1].points[0].x);
    // The fan is applied before tracing, so a shifted line still starts on the
    // vertical run it goes on to make.
    for (const wire of wires) {
      expect(wire.points[1].x).toBe(wire.points[0].x);
    }
  });

  it('falls straight past rounds that are empty in its own column', () => {
    // Two rounds between source and destination, both empty where the wire
    // would fall. There is nothing to route around, so it should not.
    const matches = [
      match('src', 0, 0),
      match('dest', 3, 0, { a: { type: 'winner', from: 'src' } }),
      // Far enough right that it is nowhere near the drop.
      match('elsewhere', 1, 4),
    ];
    const { wires } = computeWires(matches, layout(matches));
    const [wire] = wires.filter((w) => w.fromId === 'src');

    expect(wire.points.length).toBe(2);
    expect(wire.points[0].x).toBe(wire.points[1].x);
  });

  it('detours to the band only when a card really is in the way', () => {
    // Same shape, but now a card sits directly under the source.
    const matches = [
      match('src', 0, 0),
      match('dest', 3, 0, { a: { type: 'winner', from: 'src' } }),
      match('blocker', 1, 0),
    ];
    const geometry = layout(matches);
    const { wires } = computeWires(matches, geometry);
    const [wire] = wires.filter((w) => w.fromId === 'src');

    expect(wire.points.length).toBe(6);
    const band = geometry.bands.find((b) => b.key === 'main')!;
    // The vertical run is the third and fourth points of a full detour.
    expect(wire.points[2].x).toBe(wire.points[3].x);
    expect(wire.points[2].x).toBeGreaterThanOrEqual(band.left);
    expect(wire.points[2].x).toBeLessThanOrEqual(band.right);
  });

  it('runs down the destination section’s own band, not the one at its index', () => {
    // The grid stacks its stages by `stage.order`, so the measured bands come
    // in that order — which is not the order the matches arrive in. Here the
    // two disagree: 'late' is seen first in the match list but measured second.
    const matches = [
      match('src', 0, 0, { section: 'early' }),
      match('block', 1, 0, { section: 'early' }),
      match('drop', 2, 0, {
        section: 'late',
        a: { type: 'loser', from: 'src' },
      }),
    ];
    const geometry = layout(matches);
    geometry.bands = [...geometry.bands].reverse();

    const { wires } = computeWires(matches, geometry);
    const [wire] = wires;
    const lateBand = geometry.bands.find((b) => b.key === 'late')!;

    expect(wire.points.length).toBe(6);
    expect(wire.points[2].x).toBe(wire.points[3].x);
    expect(wire.points[2].x).toBeGreaterThanOrEqual(lateBand.left);
    expect(wire.points[2].x).toBeLessThanOrEqual(lateBand.right);
  });

  it('shares one lane between runs that never pass each other', () => {
    // Two elbows into the same corridor, far apart horizontally. They cannot
    // collide, so widening the gap for a second lane would be wasted.
    const matches = [
      match('a1', 0, 0),
      match('a2', 1, 0, { a: { type: 'winner', from: 'a1' } }),
      match('b1', 0, 4),
      match('b2', 1, 5, { a: { type: 'winner', from: 'b1' } }),
    ];
    const { corridorLanes } = computeWires(matches, layout(matches));
    expect(corridorLanes.get(1)).toBe(1);
  });

  it('gives overlapping runs in one corridor their own lanes', () => {
    const matches = [
      match('a1', 0, 0),
      match('a2', 1, 3, { a: { type: 'winner', from: 'a1' } }),
      match('b1', 0, 1),
      match('b2', 1, 4, { a: { type: 'winner', from: 'b1' } }),
    ];
    const { wires, corridorLanes } = computeWires(matches, layout(matches));
    expect(corridorLanes.get(1)).toBe(2);
    // Two lanes means two distinct heights for the horizontal runs.
    expect(new Set(wires.map((w) => w.points[1].y)).size).toBe(2);
  });

  it('skips a wire whose card was never measured', () => {
    const matches = [
      match('src', 0, 0),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
    ];
    const geometry = layout(matches);
    geometry.rects.delete('src');
    expect(computeWires(matches, geometry).wires).toEqual([]);
  });

  it('never draws through a card', () => {
    // A double-elim-shaped bracket: winners feeding forward, losers dropping
    // across sections, and a final consuming both.
    const matches: FlexBracketMatch[] = [
      match('w1-0', 0, 0, { section: 'winners' }),
      match('w1-1', 0, 1, { section: 'winners' }),
      match('w2-0', 1, 0, {
        section: 'winners',
        a: { type: 'winner', from: 'w1-0' },
        b: { type: 'winner', from: 'w1-1' },
      }),
      match('l1-0', 1, 0, {
        section: 'losers',
        a: { type: 'loser', from: 'w1-0' },
        b: { type: 'loser', from: 'w1-1' },
      }),
      match('l2-0', 2, 0, {
        section: 'losers',
        a: { type: 'winner', from: 'l1-0' },
        b: { type: 'loser', from: 'w2-0' },
      }),
      match('gf', 3, 0, {
        section: 'finals',
        a: { type: 'winner', from: 'w2-0' },
        b: { type: 'winner', from: 'l2-0' },
      }),
    ];

    const geometry = layout(matches);
    const { wires } = computeWires(matches, geometry);
    expect(wires.length).toBe(8);

    for (const wire of wires) {
      for (const { a, b } of segments(wire.points)) {
        for (const [id, rect] of geometry.rects) {
          // The first and last segments attach to their own cards' edges.
          if (id === wire.fromId || id === wire.toId) continue;
          expect({
            wire: `${wire.fromId}→${wire.toId}`,
            through: id,
            crosses: crossesRect(a, b, rect),
          }).toEqual({
            wire: `${wire.fromId}→${wire.toId}`,
            through: id,
            crosses: false,
          });
        }
      }
    }
  });
});
