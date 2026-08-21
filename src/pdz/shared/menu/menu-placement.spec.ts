import {
  MENU_GAP,
  MENU_MIN_HEIGHT,
  resolveMenuPlacement,
} from './menu-placement';

const VIEWPORT = { width: 1000, height: 800 };
const PANEL = { width: 200, height: 160 };
const TRIGGER = { top: 300, left: 400, width: 40, height: 32 };

describe('resolveMenuPlacement', () => {
  it('opens below the trigger with a gap', () => {
    const placement = resolveMenuPlacement(TRIGGER, PANEL, 'end', VIEWPORT);

    expect(placement.flipped).toBe(false);
    expect(placement.top).toBe(332 + MENU_GAP);
    expect(placement.bottom).toBeNull();
  });

  it('aligns the panel end to the trigger end by default', () => {
    const placement = resolveMenuPlacement(TRIGGER, PANEL, 'end', VIEWPORT);

    expect(placement.left).toBe(440 - 200);
  });

  it('aligns the panel start to the trigger start when asked', () => {
    const placement = resolveMenuPlacement(TRIGGER, PANEL, 'start', VIEWPORT);

    expect(placement.left).toBe(400);
  });

  it('flips above when the panel does not fit below', () => {
    const trigger = { ...TRIGGER, top: 700 };
    const placement = resolveMenuPlacement(trigger, PANEL, 'end', VIEWPORT);

    expect(placement.flipped).toBe(true);
    expect(placement.top).toBeNull();
    expect(placement.bottom).toBe(800 - 700 + MENU_GAP);
  });

  it('stays below when neither side fits but below has more room', () => {
    const trigger = { top: 40, left: 400, width: 40, height: 32 };
    const tall = { width: 200, height: 900 };
    const placement = resolveMenuPlacement(trigger, tall, 'end', VIEWPORT);

    expect(placement.flipped).toBe(false);
  });

  it('caps max height to the space on the chosen side', () => {
    const placement = resolveMenuPlacement(TRIGGER, PANEL, 'end', VIEWPORT);

    expect(placement.maxHeight).toBe(800 - 332 - MENU_GAP * 2);
  });

  it('never shrinks max height below the floor', () => {
    const short = { width: 1000, height: 100 };
    const trigger = { top: 40, left: 400, width: 40, height: 32 };
    const placement = resolveMenuPlacement(trigger, PANEL, 'start', short);

    expect(placement.maxHeight).toBe(MENU_MIN_HEIGHT);
  });

  it('clamps a panel that would overflow the left edge', () => {
    const trigger = { top: 300, left: 8, width: 40, height: 32 };
    const placement = resolveMenuPlacement(trigger, PANEL, 'end', VIEWPORT);

    expect(placement.left).toBe(MENU_GAP);
  });

  it('clamps a panel that would overflow the right edge', () => {
    const trigger = { top: 300, left: 960, width: 40, height: 32 };
    const placement = resolveMenuPlacement(trigger, PANEL, 'start', VIEWPORT);

    expect(placement.left).toBe(1000 - 200 - MENU_GAP);
  });

  it('keeps a panel wider than the viewport pinned to the gap', () => {
    const wide = { width: 1200, height: 160 };
    const placement = resolveMenuPlacement(TRIGGER, wide, 'end', VIEWPORT);

    expect(placement.left).toBe(MENU_GAP);
  });
});
