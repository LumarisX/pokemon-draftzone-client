import {
  cycleKoState,
  emptyKoGraph,
  koGraphWinner,
  koKey,
  koKills,
  koState,
  koStatus,
  koSurvivors,
  linkKo,
  setKoNote,
  toggleKoIndirect,
  toggleKoPreview,
  unlinkKo,
} from './ko-graph.model';

const a1 = koKey('side1', 'garchomp');
const a2 = koKey('side1', 'rotomwash');
const b1 = koKey('side2', 'dragapult');
const b2 = koKey('side2', 'ironvaliant');

describe('ko-graph model', () => {
  it('cycles a card through benched, played and fainted', () => {
    let graph = emptyKoGraph();
    expect(koState(graph, a1)).toBe('benched');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('played');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('fainted');

    graph = cycleKoState(graph, a1);
    expect(koState(graph, a1)).toBe('benched');
  });

  it('sends a preview-only card straight to played', () => {
    const graph = cycleKoState(toggleKoPreview(emptyKoGraph(), a1), a1);
    expect(koState(graph, a1)).toBe('played');
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
    expect(koState(graph, a1)).toBe('benched');
  });

  it('drops only the incoming KO when a victim stops being fainted', () => {
    let graph = linkKo(emptyKoGraph(), a1, b1);
    graph = linkKo(graph, b1, a2);
    graph = cycleKoState(graph, b1);
    expect(koState(graph, b1)).toBe('benched');
    expect(graph.edges).toHaveLength(0);
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
});
