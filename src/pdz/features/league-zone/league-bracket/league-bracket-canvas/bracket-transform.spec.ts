import {
  MIN_SCALE,
  fitToContent,
  screenToWorld,
  worldToScreen,
} from './bracket-transform';

describe('bracket-transform', () => {
  it('round-trips world ↔ screen through a transform', () => {
    const t = { x: 40, y: -12, k: 1.75 };
    const s = worldToScreen(123, 456, t);
    const w = screenToWorld(s.x, s.y, t);
    expect(w.x).toBeCloseTo(123);
    expect(w.y).toBeCloseTo(456);
  });

  it('fits large content by scaling down and centering', () => {
    const t = fitToContent(2000, 1000, 800, 600, 0);
    expect(t.k).toBeCloseTo(0.4); // width-bound
    expect(t.x).toBeCloseTo(0);
    expect(t.y).toBeCloseTo((600 - 1000 * 0.4) / 2);
  });

  it('never scales past 100% for small content', () => {
    const t = fitToContent(200, 100, 800, 600);
    expect(t.k).toBe(1);
    expect(t.x).toBeCloseTo(300);
    expect(t.y).toBeCloseTo(250);
  });

  it('clamps to the minimum scale for enormous content', () => {
    const t = fitToContent(100000, 100, 800, 600, 0);
    expect(t.k).toBe(MIN_SCALE);
  });
});
