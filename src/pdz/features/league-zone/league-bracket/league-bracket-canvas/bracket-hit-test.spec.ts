import { FlexBracketData } from '../bracket.model';
import {
  buildHitRegions,
  hitTestConnector,
  queryHitRegion,
} from './bracket-hit-test';
import { computeBracketLayout } from './bracket-layout';

const data = (withReplay: boolean): FlexBracketData => ({
  teams: [
    { teamName: 'Alpha', coachName: 'A', seed: 1 },
    { teamName: 'Bravo', coachName: 'B', seed: 2 },
  ],
  matches: [
    {
      id: 'm1',
      round: 0,
      position: 0,
      a: { type: 'seed', seed: 1 },
      b: { type: 'seed', seed: 2 },
      winner: withReplay ? 0 : undefined,
      replay: withReplay ? 'https://replay.example/abc' : undefined,
    },
  ],
});

describe('buildHitRegions / queryHitRegion', () => {
  it('returns null for background points', () => {
    const layout = computeBracketLayout(data(false), false);
    const regions = buildHitRegions(layout, false);
    expect(queryHitRegion(-50, -50, regions)).toBeNull();
    expect(queryHitRegion(10000, 10000, regions)).toBeNull();
  });

  it('prefers the topmost (later-painted) region on overlap', () => {
    const layout = computeBracketLayout(data(false), true);
    const regions = buildHitRegions(layout, true);
    const match = layout.matches[0];

    // A slot rect sits inside the card rect and is painted after it.
    const slotHit = queryHitRegion(
      match.x + match.w / 2,
      match.slotY[0] + 10,
      regions,
    );
    expect(slotHit?.kind).toBe('slot');
    expect(slotHit?.slotIndex).toBe(0);

    // The card's label strip (outside slot/delete rects) hits the card itself.
    const cardHit = queryHitRegion(match.x + 30, match.y + 12, regions);
    expect(cardHit?.kind).toBe('match-card');
    expect(cardHit?.matchId).toBe('m1');
  });

  it('exposes edit affordances only when editable', () => {
    const layout = computeBracketLayout(data(false), false);
    const kinds = new Set(buildHitRegions(layout, false).map((r) => r.kind));
    expect(kinds.has('slot')).toBe(false);
    expect(kinds.has('delete-icon')).toBe(false);
    expect(kinds.has('add-match-btn')).toBe(false);

    const editLayout = computeBracketLayout(data(false), true);
    const editKinds = new Set(
      buildHitRegions(editLayout, true).map((r) => r.kind),
    );
    expect(editKinds.has('slot')).toBe(true);
    expect(editKinds.has('edit-icon')).toBe(true);
    expect(editKinds.has('delete-icon')).toBe(true);
    expect(editKinds.has('add-match-btn')).toBe(true);
    expect(editKinds.has('add-round-btn')).toBe(true);
    expect(editKinds.has('round-title')).toBe(true);
  });

  it('hit-tests round titles in the header row', () => {
    const layout = computeBracketLayout(data(false), true);
    const regions = buildHitRegions(layout, true);
    const col = layout.sections[0].columns[0];
    const hit = queryHitRegion(col.x + 120, col.headerY + 10, regions);
    expect(hit?.kind).toBe('round-title');
    expect(hit?.section).toBe('main');
    expect(hit?.round).toBe(0);
  });

  it('adds a replay-link region only for decided matches with a replay', () => {
    const noReplay = computeBracketLayout(data(false), false);
    expect(
      buildHitRegions(noReplay, false).some((r) => r.kind === 'replay-link'),
    ).toBe(false);

    const withReplay = computeBracketLayout(data(true), false);
    const regions = buildHitRegions(withReplay, false);
    const replay = regions.find((r) => r.kind === 'replay-link');
    expect(replay).toBeDefined();
    expect(
      queryHitRegion(replay!.x + 2, replay!.y + 2, regions)?.kind,
    ).toBe('replay-link');
  });
});

describe('hitTestConnector', () => {
  const connectors = [
    { points: [{ x: 0, y: 0 }, { x: 100, y: 0 }] },
    { points: [{ x: 0, y: 50 }, { x: 50, y: 50 }, { x: 50, y: 150 }] },
  ];

  it('returns the connector within tolerance of the point', () => {
    expect(hitTestConnector(50, 3, connectors, 6)).toBe(0);
    expect(hitTestConnector(53, 100, connectors, 6)).toBe(1);
  });

  it('tests every segment of a polyline, not just endpoints', () => {
    // Midway down the vertical segment of connector 1.
    expect(hitTestConnector(50, 100, connectors, 1)).toBe(1);
  });

  it('returns null when nothing is within tolerance', () => {
    expect(hitTestConnector(50, 25, connectors, 6)).toBeNull();
    expect(hitTestConnector(500, 500, connectors, 6)).toBeNull();
  });

  it('picks the closest connector when several are in tolerance', () => {
    expect(hitTestConnector(10, 20, connectors, 100)).toBe(0);
    expect(hitTestConnector(10, 40, connectors, 100)).toBe(1);
  });
});
