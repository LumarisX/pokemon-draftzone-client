import { FlexBracketData, FlexBracketMatch } from '../bracket.model';
import {
  generateDoubleElimination,
  generateSingleElimination,
} from '../bracket-generator';
import {
  COL_GAP,
  COL_W,
  MATCH_GAP,
  ROW_GAP,
  TEAM_H_COMPACT,
  TEAM_H_FULL,
  computeBracketLayout,
  computeRoundTitles,
  computeVerticalCenters,
  matchHeight,
  resolveSlot,
} from './bracket-layout';

const MATCH_H = matchHeight(TEAM_H_COMPACT);

const seed = (n: number) => ({ type: 'seed', seed: n }) as const;
const winnerOf = (from: string) => ({ type: 'winner', from }) as const;

/** 4-team single-elim wiring: two semis feeding a final. */
const fourTeamMatches = (): FlexBracketMatch[] => [
  { id: 's1', round: 0, position: 0, a: seed(1), b: seed(4) },
  { id: 's2', round: 0, position: 1, a: seed(2), b: seed(3) },
  { id: 'f', round: 1, position: 0, a: winnerOf('s1'), b: winnerOf('s2') },
];

const fourTeamData = (): FlexBracketData => ({
  teams: [
    { teamName: 'Alpha', coachName: 'A', seed: 1 },
    { teamName: 'Bravo', coachName: 'B', seed: 2 },
    { teamName: 'Charlie', coachName: 'C', seed: 3 },
    { teamName: 'Delta', coachName: 'D', seed: 4 },
  ],
  matches: fourTeamMatches(),
});

describe('computeVerticalCenters', () => {
  it('spaces leaf matches by position and stride', () => {
    const centers = computeVerticalCenters(fourTeamMatches(), MATCH_H);
    expect(centers.get('s1')).toBe(MATCH_H / 2);
    expect(centers.get('s2')).toBe(MATCH_H + MATCH_GAP + MATCH_H / 2);
  });

  it('centers a match with two inputs at their average', () => {
    const centers = computeVerticalCenters(fourTeamMatches(), MATCH_H);
    expect(centers.get('f')).toBe((centers.get('s1')! + centers.get('s2')!) / 2);
  });

  it('inherits the center of a single resolved input', () => {
    const matches: FlexBracketMatch[] = [
      { id: 's1', round: 0, position: 1, a: seed(1), b: seed(2) },
      { id: 'f', round: 1, position: 0, a: winnerOf('s1'), b: seed(3) },
    ];
    const centers = computeVerticalCenters(matches, MATCH_H);
    expect(centers.get('f')).toBe(centers.get('s1'));
  });

  it('normalizes so the topmost card starts at top 0 for 1-indexed positions', () => {
    const matches: FlexBracketMatch[] = [
      { id: 'a', round: 0, position: 1, a: seed(1), b: seed(2) },
      { id: 'b', round: 0, position: 2, a: seed(3), b: seed(4) },
    ];
    const centers = computeVerticalCenters(matches, MATCH_H);
    expect(centers.get('a')).toBe(MATCH_H / 2);
  });
});

describe('resolveSlot', () => {
  it('resolves seeds to teams and follows winner chains once decided', () => {
    const data = fourTeamData();
    const s1 = resolveSlot(seed(1), data.teams, data.matches);
    expect(s1.team?.teamName).toBe('Alpha');

    const pending = resolveSlot(winnerOf('s1'), data.teams, data.matches);
    expect(pending.team).toBeNull();

    data.matches[0].winner = 1; // Delta beats Alpha
    const decided = resolveSlot(winnerOf('s1'), data.teams, data.matches);
    expect(decided.team?.teamName).toBe('Delta');
  });

  it('labels unassigned and unknown-seed slots', () => {
    expect(resolveSlot({ type: 'empty' }, [], []).placeholder).toBe(
      'Unassigned',
    );
    expect(resolveSlot(seed(9), [], []).placeholder).toBe('Seed 9');
  });

  it('labels pending winner/loser slots with the source match label', () => {
    const labels = new Map([['s1', 'Match 1']]);
    const matches = fourTeamMatches();
    expect(
      resolveSlot(winnerOf('s1'), [], matches, labels).placeholder,
    ).toBe('Winner of Match 1');
    expect(
      resolveSlot({ type: 'loser', from: 's1' }, [], matches, labels)
        .placeholder,
    ).toBe('Loser of Match 1');
  });
});

describe('computeRoundTitles', () => {
  it('labels winners-like sections backwards from Finals', () => {
    expect(computeRoundTitles([0, 1, 2], 'main', 8)).toEqual([
      'Quarter-Finals',
      'Semi-Finals',
      'Finals',
    ]);
  });

  it('respects overrides and generic sections', () => {
    expect(
      computeRoundTitles([0, 1], 'consolation', 8, { 1: 'Custom' }),
    ).toEqual(['Round 1', 'Custom']);
    expect(computeRoundTitles([0, 1], 'finals', 8)).toEqual([
      'Grand Finals',
      'Grand Finals Reset',
    ]);
  });

  it('end-anchors the last two losers rounds, numbering the rest', () => {
    expect(computeRoundTitles([0, 1, 2, 3], 'losers', 8)).toEqual([
      'Round 1',
      'Round 2',
      'Semi-Finals',
      'Finals',
    ]);
  });
});

describe('computeBracketLayout', () => {
  it('lays out columns left-to-right with the standard stride', () => {
    const layout = computeBracketLayout(fourTeamData(), false);
    const [section] = layout.sections;
    expect(layout.sections.length).toBe(1);
    expect(section.columns.map((c) => c.x)).toEqual([0, COL_W + COL_GAP]);

    const final = layout.matches.find((m) => m.id === 'f')!;
    expect(final.x).toBe(COL_W + COL_GAP);
    const s1 = layout.matches.find((m) => m.id === 's1')!;
    const s2 = layout.matches.find((m) => m.id === 's2')!;
    expect(final.y + final.h / 2).toBe(
      (s1.y + s1.h / 2 + (s2.y + s2.h / 2)) / 2,
    );
  });

  it('creates one connector per winner/loser slot, ending at the slot row', () => {
    const layout = computeBracketLayout(fourTeamData(), false);
    expect(layout.connectors.length).toBe(2);
    const final = layout.matches.find((m) => m.id === 'f')!;
    const targets = layout.connectors.map((c) => c.y2).sort((a, b) => a - b);
    expect(targets[0]).toBeCloseTo(final.slotY[0] + TEAM_H_FULL / 2);
    expect(targets[1]).toBeCloseTo(final.slotY[1] + TEAM_H_FULL / 2);
  });

  it('colors connectors by outcome type and anchors decided lines to the deciding row', () => {
    const data = fourTeamData();
    data.matches[0].winner = 1; // s1 decided: slot B advances
    const layout = computeBracketLayout(data, false);
    const s1 = layout.matches.find((m) => m.id === 's1')!;
    const s2 = layout.matches.find((m) => m.id === 's2')!;

    expect(layout.connectors.every((c) => c.cls === 'winner')).toBe(true);

    // Decided: solid line from the winning team's row (slot B).
    const fromS1 = layout.connectors.find((c) => c.x1 === s1.x + s1.w && c.y1 !== s1.y + s1.h / 2)!;
    expect(fromS1.decided).toBe(true);
    expect(fromS1.y1).toBeCloseTo(s1.slotY[1] + TEAM_H_FULL / 2);

    // Undecided: dashed line from the card's vertical center.
    const fromS2 = layout.connectors.find((c) => c.y1 === s2.y + s2.h / 2)!;
    expect(fromS2.decided).toBe(false);
  });

  it('never overlaps matches that average to the same center (winners + losers of the same feeders)', () => {
    const matches: FlexBracketMatch[] = [
      { id: 'm1', round: 0, position: 0, a: seed(1), b: seed(2) },
      { id: 'm2', round: 0, position: 1, a: seed(3), b: seed(4) },
      {
        id: 'm3',
        round: 1,
        position: 0,
        a: winnerOf('m1'),
        b: winnerOf('m2'),
      },
      {
        id: 'm4',
        round: 1,
        position: 1,
        a: { type: 'loser', from: 'm1' },
        b: { type: 'loser', from: 'm2' },
      },
    ];
    const layout = computeBracketLayout(
      { teams: fourTeamData().teams, matches },
      false,
    );
    const m3 = layout.matches.find((m) => m.id === 'm3')!;
    const m4 = layout.matches.find((m) => m.id === 'm4')!;
    // m3 keeps the averaged center (lower position wins the tiebreak);
    // m4 is pushed below it by at least the minimum gap.
    expect(m4.y).toBeGreaterThanOrEqual(m3.y + m3.h + MATCH_GAP);
    // Loser lines are red-classed, winner lines green-classed.
    expect(
      layout.connectors.filter((c) => c.cls === 'loser').length,
    ).toBe(2);
    expect(
      layout.connectors.filter((c) => c.cls === 'winner').length,
    ).toBe(2);

    // Lines leaving the same undecided card are fanned apart at the origin...
    const m1 = layout.matches.find((m) => m.id === 'm1')!;
    const fromM1 = layout.connectors
      .filter((c) => c.x1 === m1.x + m1.w && c.y2 < m4.y + m4.h + 100)
      .filter((c) => Math.abs(c.y1 - (m1.y + m1.h / 2)) <= 12);
    expect(fromM1.length).toBe(2);
    expect(fromM1[0].y1).not.toBe(fromM1[1].y1);

    // ...and vertical segments in the shared corridor never stack on one x.
    const midXs = layout.connectors
      .filter((c) => Math.abs(c.y2 - c.y1) >= 2)
      .map((c) => c.midX);
    expect(new Set(midXs).size).toBe(midXs.length);
  });

  it('adds edit-mode buttons: one + Match per column and one + Round per section', () => {
    const layout = computeBracketLayout(fourTeamData(), true);
    expect(layout.addMatchButtons.length).toBe(2);
    const addRound = layout.addRoundButtons;
    expect(addRound.length).toBe(1);
    expect(addRound[0].round).toBe(2); // past the last existing round
    expect(addRound[0].x).toBe(2 * (COL_W + COL_GAP));
  });

  it('renders configured-but-empty sections only in edit mode', () => {
    const data: FlexBracketData = {
      teams: [],
      matches: [],
      sections: [{ key: 'main', order: 0 }],
    };
    expect(computeBracketLayout(data, false).sections.length).toBe(0);
    const editable = computeBracketLayout(data, true);
    expect(editable.sections.length).toBe(1);
    expect(editable.addRoundButtons[0].round).toBe(0);
  });

  it('stacks double-elim sections vertically in configured order', () => {
    const generated = generateDoubleElimination(8);
    const layout = computeBracketLayout(
      { teams: [], matches: generated.matches, sections: generated.sections },
      false,
    );
    expect(layout.sections.map((s) => s.key)).toEqual([
      'winners',
      'losers',
      'finals',
    ]);
    const [winners, losers, finals] = layout.sections;
    expect(losers.y).toBeGreaterThan(winners.bottom);
    expect(finals.y).toBeGreaterThan(losers.bottom);
    expect(layout.height).toBe(finals.bottom);
  });

  it('sizes "Round of N" titles from wired seeds when no teams are bound (random seeding)', () => {
    // Certified-random builder: seeds are wired but no team list is bound.
    const generated = generateSingleElimination(24);
    const layout = computeBracketLayout(
      { teams: [], matches: generated.matches, sections: generated.sections },
      true,
    );
    const titles = layout.sections[0].columns.map((c) => c.title);
    expect(titles[0]).toBe('Round of 24');
    expect(titles[1]).toBe('Round of 16');
    expect(titles[titles.length - 1]).toBe('Finals');
  });

  it('uses full-height team rows when teams are bound, compact rows otherwise', () => {
    const withTeams = computeBracketLayout(fourTeamData(), false);
    expect(withTeams.matches[0].h).toBe(matchHeight(TEAM_H_FULL));
    expect(withTeams.matches[0].slotY[1] - withTeams.matches[0].slotY[0]).toBe(
      TEAM_H_FULL + ROW_GAP,
    );

    const noTeams = computeBracketLayout(
      { teams: [], matches: fourTeamMatches() },
      false,
    );
    expect(noTeams.matches[0].h).toBe(matchHeight(TEAM_H_COMPACT));
  });

  it('numbers unlabeled matches per section', () => {
    const layout = computeBracketLayout(fourTeamData(), false);
    expect(layout.matchLabelById.get('s1')).toBe('Match 1');
    expect(layout.matchLabelById.get('f')).toBe('Match 3');
  });

  it('shows pending slots as Winner/Loser of the source match label', () => {
    const layout = computeBracketLayout(fourTeamData(), false);
    const final = layout.matches.find((m) => m.id === 'f')!;
    expect(final.slots[0].placeholder).toBe('Winner of Match 1');
    expect(final.slots[1].placeholder).toBe('Winner of Match 2');
  });
});
