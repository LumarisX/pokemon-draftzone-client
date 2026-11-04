import {
  cycleKoState,
  emptyKoGraph,
  keepSheet,
  koGraphFromStatuses,
  koGraphWinner,
  koKey,
  koKills,
  koState,
  koStatus,
  koSurvivors,
  kosFromKoGraph,
  linkKo,
  mergeSheet,
  setKoNote,
  setKoState,
  toggleKoIndirect,
  toggleSheetKey,
  unlinkKo,
} from './ko-graph.model';

const a1 = koKey('side1', 'garchomp');
const a2 = koKey('side1', 'rotomwash');
const b1 = koKey('side2', 'dragapult');
const b2 = koKey('side2', 'ironvaliant');

describe('ko-graph model', () => {
  it('cycles a sheet Pokémon from the back through survived and fainted', () => {
    let graph = emptyKoGraph();
    expect(koState(graph, a1)).toBe('back');
    expect(koStatus(graph, a1)).toBe('brought');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('played');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('fainted');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('back');
  });

  it('brings both Pokemon in when a KO is drawn', () => {
    const graph = linkKo(emptyKoGraph(), a1, b1);
    expect(koState(graph, a1)).toBe('played');
    expect(koState(graph, b1)).toBe('fainted');
    expect(koStatus(graph, b1)).toBe('fainted');
  });

  it('keeps one incoming KO per victim', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, a2, b1);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe(a2);
  });

  it('drops attached KOs when a card leaves the field', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, b2, a1);
    graph = cycleKoState(graph, a1);
    expect(graph.edges).toHaveLength(0);
    expect(koState(graph, a1)).toBe('back');
  });

  it('drops only the incoming KO when a victim stops being fainted', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, b1, a2);
    graph = setKoState(graph, b1, 'played');
    expect(graph.edges).toEqual([
      { from: b1, to: a2, indirect: false, note: '' },
    ]);
  });

  it('buckets kills by direction and directness', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, a1, b2);
    graph = toggleKoIndirect(graph, b2);
    graph = linkKo(graph, a1, a2);

    expect(koKills(graph, a1)).toEqual({
      direct: 1,
      indirect: 1,
      teammate: 1,
    });
  });

  it('credits nobody for a self KO', () => {
    const graph = linkKo(emptyKoGraph(), a1, a1);
    expect(koState(graph, a1)).toBe('fainted');
    expect(koKills(graph, a1)).toEqual({
      direct: 0,
      indirect: 0,
      teammate: 0,
    });
  });

  it('keeps the victim fainted when its KO is removed', () => {
    const graph = unlinkKo(linkKo(emptyKoGraph(), a1, b1), b1);
    expect(graph.edges).toHaveLength(0);
    expect(koState(graph, b1)).toBe('fainted');
  });

  it('trims notes', () => {
    const graph = setKoNote(linkKo(emptyKoGraph(), a1, b1), b1, '  Draco  ');
    expect(graph.edges[0].note).toBe('Draco');
  });

  it('counts survivors and picks the winner', () => {
    let graph = cycleKoState(emptyKoGraph(), a1);
    graph = cycleKoState(graph, a2);
    graph = linkKo(graph, a1, b1);

    const keys = { side1: [a1, a2], side2: [b1, b2] };
    expect(koSurvivors(graph, keys.side1)).toBe(2);
    expect(koSurvivors(graph, keys.side2)).toBe(0);
    expect(koGraphWinner(graph, keys)).toBe('side1');
  });

  it('has no winner when survivors are level', () => {
    const keys = { side1: [a1], side2: [b1] };
    expect(koGraphWinner(emptyKoGraph(), keys)).toBeNull();
  });

  it('caps a team sheet at six and keeps it in roster order', () => {
    const roster = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
    let sheet: readonly string[] = [];
    for (const key of [...roster].reverse()) {
      sheet = toggleSheetKey(sheet, roster, key);
    }
    expect(sheet).toEqual(['m2', 'm3', 'm4', 'm5', 'm6', 'm7']);
    expect(toggleSheetKey(sheet, roster, 'm4')).toEqual([
      'm2',
      'm3',
      'm5',
      'm6',
      'm7',
    ]);
  });

  it('adds what a replay shows to the sheet, or swaps to it when that would pass six', () => {
    const roster = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
    expect(mergeSheet(['m3'], roster, ['m1', 'm2'])).toEqual(['m1', 'm2', 'm3']);
    expect(
      mergeSheet(['m1', 'm2', 'm3'], roster, ['m4', 'm5', 'm6', 'm7']),
    ).toEqual(['m4', 'm5', 'm6', 'm7']);
    expect(mergeSheet(['m1'], roster, [])).toEqual(['m1']);
  });

  it('drops a Pokémon taken off the sheet from the game, KOs included', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, b2, a2);

    const kept = keepSheet(graph, { side1: [a1, a2], side2: [b2] });

    expect(Object.keys(kept.states).sort()).toEqual([a1, a2, b2].sort());
    expect(kept.edges).toEqual([
      { from: b2, to: a2, indirect: false, note: '' },
    ]);
  });

  it('turns arrows into stored KOs, leaving a self-KO without an attacker', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = setKoNote(graph, b1, 'Earthquake');
    graph = linkKo(graph, a1, a2);
    graph = linkKo(graph, b2, b2);
    graph = toggleKoIndirect(graph, b2);

    expect(kosFromKoGraph(graph)).toEqual([
      {
        victim: { team: 'b', pokemon: 'dragapult' },
        attacker: { team: 'a', pokemon: 'garchomp' },
        indirect: false,
        note: 'Earthquake',
      },
      {
        victim: { team: 'a', pokemon: 'rotomwash' },
        attacker: { team: 'a', pokemon: 'garchomp' },
        indirect: false,
      },
      {
        victim: { team: 'b', pokemon: 'ironvaliant' },
        indirect: true,
      },
    ]);
  });

  it('rebuilds the same arrows from stored KOs', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = setKoNote(graph, b1, 'Earthquake');
    graph = linkKo(graph, b2, b2);

    const rebuilt = koGraphFromStatuses(
      [
        { key: a1, status: 'survived' },
        { key: b1, status: 'fainted' },
        { key: b2, status: 'fainted' },
      ],
      kosFromKoGraph(graph),
    );

    expect(rebuilt.edges).toEqual(graph.edges);
    expect(koKills(rebuilt, a1)).toEqual({ direct: 1, indirect: 0, teammate: 0 });
  });

  it('has no arrows for a game saved without a KO map', () => {
    const graph = koGraphFromStatuses([{ key: a1, status: 'survived' }]);
    expect(graph.edges).toEqual([]);
  });
});
