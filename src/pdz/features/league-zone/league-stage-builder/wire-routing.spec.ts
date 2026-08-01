import { FlexBracketMatch } from '../league-bracket/bracket.model';
import {
  computeWires,
  LANE_STEP,
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
  it('routes an adjacent same-section edge as an elbow', () => {
    const matches = [
      match('semi-a', 0, 0),
      match('semi-b', 0, 1),
      match('final', 1, 0, {
        a: { type: 'winner', from: 'semi-a' },
        b: { type: 'winner', from: 'semi-b' },
      }),
    ];
    const { routes } = planRoutes(matches);
    expect(routes.length).toBe(2);
    expect(routes.every((r) => r.kind === 'elbow')).toBe(true);
    // Both enter the corridor above round 1.
    expect(routes.every((r) => r.corrOut === 1)).toBe(true);
  });

  it('routes a cross-section drop as a bus', () => {
    const matches = [
      match('w1', 0, 0, { section: 'winners' }),
      match('l1', 2, 0, {
        section: 'losers',
        a: { type: 'loser', from: 'w1' },
      }),
    ];
    const { routes } = planRoutes(matches);
    expect(routes[0].kind).toBe('bus');
    expect(routes[0].corrOut).toBe(1);
    expect(routes[0].corrIn).toBe(2);
  });

  it('gives every line sharing a corridor its own lane', () => {
    const matches = [
      match('a', 0, 0),
      match('b', 0, 1),
      match('c', 1, 0, { a: { type: 'winner', from: 'a' } }),
      match('d', 1, 1, { a: { type: 'winner', from: 'b' } }),
    ];
    const { routes, corridorLanes } = planRoutes(matches);
    const lanes = routes.map((r) => r.laneOut);
    expect(new Set(lanes).size).toBe(routes.length);
    expect(corridorLanes.get(1)).toBe(2);
  });

  it('lets separate sections reuse elbow lanes', () => {
    const matches = [
      match('a1', 0, 0, { section: 'x' }),
      match('a2', 1, 0, { section: 'x', a: { type: 'winner', from: 'a1' } }),
      match('b1', 0, 0, { section: 'y' }),
      match('b2', 1, 0, { section: 'y', a: { type: 'winner', from: 'b1' } }),
    ];
    const { corridorLanes } = planRoutes(matches);
    // Two elbows, but they can't collide — one lane is enough for both.
    expect(corridorLanes.get(1)).toBe(1);
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
      x: destRect.x + destRect.w * 0.3 - srcRect.w / 2,
    });

    const [wire] = computeWires(matches, geometry);
    expect(wire.points.length).toBe(2);
  });

  it('elbows through the corridor between the two rows', () => {
    const matches = [
      match('src', 0, 1),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
    ];
    const [wire] = computeWires(matches, layout(matches));
    expect(wire.points.length).toBe(4);
    const corridorY = wire.points[1].y;
    // The horizontal run sits in the gap, clear of both rows.
    expect(corridorY).toBeGreaterThan(rowTop(0) + ROW_H);
    expect(corridorY).toBeLessThan(rowTop(1));
    expect(wire.points[2].y).toBe(corridorY);
  });

  it('anchors a decided line to the team it carries', () => {
    const matches = [
      match('src', 0, 0, { winner: 1 }),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
      match('drop', 1, 1, { a: { type: 'loser', from: 'src' } }),
    ];
    const wires = computeWires(matches, layout(matches));
    const srcRect = layout(matches).rects.get('src')!;
    const winnerWire = wires.find((w) => w.cls === 'winner')!;
    const loserWire = wires.find((w) => w.cls === 'loser')!;

    // Winner came from row 1, the loser therefore from row 0.
    expect(winnerWire.points[0].x).toBeCloseTo(srcRect.x + srcRect.w * 0.7, 0);
    expect(loserWire.points[0].x).toBeCloseTo(srcRect.x + srcRect.w * 0.3, 0);
  });

  it('fans apart two undecided lines leaving the same card', () => {
    const matches = [
      match('src', 0, 0),
      match('up', 1, 0, { a: { type: 'winner', from: 'src' } }),
      match('down', 1, 1, { a: { type: 'loser', from: 'src' } }),
    ];
    const wires = computeWires(matches, layout(matches));
    expect(wires[0].points[0].x).not.toBe(wires[1].points[0].x);
  });

  it('skips a wire whose card was never measured', () => {
    const matches = [
      match('src', 0, 0),
      match('dest', 1, 0, { a: { type: 'winner', from: 'src' } }),
    ];
    const geometry = layout(matches);
    geometry.rects.delete('src');
    expect(computeWires(matches, geometry)).toEqual([]);
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
    const wires = computeWires(matches, geometry);
    expect(wires.length).toBe(8);
    // Guards the assertion below against passing trivially: if every wire were
    // a straight drop there would be nothing for a card to get in the way of.
    expect(wires.some((w) => w.points.length === 6)).toBe(true);

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
