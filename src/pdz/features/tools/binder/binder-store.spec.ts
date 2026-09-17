import { TestBed } from '@angular/core/testing';
import { BinderStore, ROSTER } from './binder-store';

const ACTIVE = ROSTER.filter((card) => card.kind !== 'cosmetic');
const ACTIVE_IDS = ACTIVE.map((card) => card.id);

function makeStore(): BinderStore {
  return TestBed.configureTestingModule({}).inject(BinderStore);
}

function layoutIds(store: BinderStore): string[] {
  return store.layout().flatMap((entry) => (entry.id ? [entry.id] : []));
}

const cardIds = layoutIds;

describe('BinderStore', () => {
  beforeEach(() => localStorage.clear());

  it('seeds the layout with every non-cosmetic card in dex order', () => {
    const store = makeStore();
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
    expect(store.stats().owned).toBe(0);
  });

  it('leaves cosmetic variants out until they are asked for', () => {
    const store = makeStore();
    const cosmetic = ROSTER.filter((card) => card.kind === 'cosmetic');
    expect(cosmetic.length).toBeGreaterThan(0);

    for (const card of cosmetic) {
      expect(layoutIds(store)).not.toContain(card.id);
    }

    store.setShowCosmetic(true);
    expect(layoutIds(store)).toEqual(ROSTER.map((card) => card.id));

    store.setShowCosmetic(false);
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
  });

  it('keeps blanks and owned marks when cosmetics are toggled', () => {
    const store = makeStore();
    const owned = store.slots()[2].key;
    store.toggleOwned(owned);
    store.insertBlank(0);

    store.setShowCosmetic(true);
    store.setShowCosmetic(false);

    expect(store.isOwned(owned)).toBe(true);
    expect(store.stats().blanks).toBe(1);
    expect(cardIds(store)).toEqual(ACTIVE_IDS);
  });

  it('regroups pages when the pocket layout changes', () => {
    const store = makeStore();
    expect(store.pageSize()).toBe(16);
    expect(store.slots()[16].page).toBe(2);

    store.setPageGrid(3, 3);

    expect(store.pageSize()).toBe(9);
    expect(store.slots()[9].page).toBe(2);
    expect(store.slots()[9].pocket).toBe(1);
    expect(store.stats().pages).toBe(Math.ceil(ACTIVE.length / 9));
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
  });

  it('clamps the pocket layout to a usable range', () => {
    const store = makeStore();

    store.setPageGrid(0, 99);
    expect(store.cols()).toBe(1);
    expect(store.rows()).toBe(8);

    store.setPageGrid('abc', '3');
    expect(store.cols()).toBe(1);
    expect(store.rows()).toBe(3);

    store.setPageGrid(2.9, 4);
    expect(store.cols()).toBe(2);
    expect(store.pageSize()).toBe(8);
  });

  it('supports a non-square page', () => {
    const store = makeStore();
    store.setPageGrid(4, 3);

    expect(store.pageSize()).toBe(12);
    expect(store.slots()[11].page).toBe(1);
    expect(store.slots()[12].page).toBe(2);
    expect(store.slots()[12].pocket).toBe(1);
  });

  it('lays pages out left to right with a gutter column between them', () => {
    const store = makeStore();
    const slots = store.slots();

    expect(slots[0]).toEqual(
      expect.objectContaining({ gridRow: 1, gridColumn: 1 }),
    );
    expect(slots[3]).toEqual(
      expect.objectContaining({ gridRow: 1, gridColumn: 4 }),
    );
    expect(slots[4]).toEqual(
      expect.objectContaining({ gridRow: 2, gridColumn: 1 }),
    );
    expect(slots[15]).toEqual(
      expect.objectContaining({ gridRow: 4, gridColumn: 4 }),
    );

    expect(slots[16]).toEqual(
      expect.objectContaining({ page: 2, gridRow: 1, gridColumn: 6 }),
    );
    expect(slots[32]).toEqual(
      expect.objectContaining({ page: 3, gridRow: 1, gridColumn: 11 }),
    );
  });

  it('never places two slots in the same grid cell', () => {
    const store = makeStore();
    store.setPageGrid(3, 4);
    const seen = new Set(
      store.slots().map((slot) => `${slot.gridRow}:${slot.gridColumn}`),
    );
    expect(seen.size).toBe(store.slots().length);
  });

  it('re-flows the grid when the pocket layout changes', () => {
    const store = makeStore();
    store.setPageGrid(2, 2);

    const slots = store.slots();
    expect(slots[3]).toEqual(
      expect.objectContaining({ page: 1, gridRow: 2, gridColumn: 2 }),
    );
    expect(slots[4]).toEqual(
      expect.objectContaining({ page: 2, gridRow: 1, gridColumn: 4 }),
    );
  });

  it('shifts every later card when a blank is inserted', () => {
    const store = makeStore();
    const sixteenth = store.slots()[15].card!.id;

    store.insertBlank(4);

    expect(store.slots()[4].card).toBeNull();
    expect(store.slots()[16].card?.id).toBe(sixteenth);
    expect(store.slots()[16].page).toBe(2);
    expect(store.stats().cards).toBe(ACTIVE.length);
  });

  it('pads with just enough blanks to start a fresh page', () => {
    const store = makeStore();
    const card = store.slots()[5].card!.id;

    store.padToPageEnd(5);

    expect(store.stats().blanks).toBe(11);
    const slot = store.slots().find((entry) => entry.card?.id === card)!;
    expect(slot.pocket).toBe(1);
    expect(slot.page).toBe(2);
  });

  it('does not pad a card that already starts a page', () => {
    const store = makeStore();
    store.padToPageEnd(0);
    store.padToPageEnd(16);
    expect(store.stats().blanks).toBe(0);
  });

  it('clears every blank at once', () => {
    const store = makeStore();
    store.insertBlank(3);
    store.insertBlank(20);
    expect(store.stats().blanks).toBe(2);

    store.removeBlanks();

    expect(store.stats().blanks).toBe(0);
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
  });

  it('keeps owned marks when cards are reordered', () => {
    const store = makeStore();
    const moved = store.slots()[0];
    store.toggleOwned(moved.key);

    store.move(0, 30);

    expect(store.slots()[30].key).toBe(moved.key);
    expect(store.slots()[30].card?.id).toBe(moved.card!.id);
    expect(store.isOwned(moved.key)).toBe(true);
  });

  it('moves a removed card to the tray and restores it in dex position', () => {
    const store = makeStore();
    const removed = store.slots()[5].card!.id;
    const before = store.slots()[4].card!.id;

    store.removeAt(5);
    expect(cardIds(store)).not.toContain(removed);
    expect(store.removed().map((card) => card.id)).toEqual([removed]);

    store.restore(removed);
    const layout = cardIds(store);
    expect(layout.indexOf(removed)).toBe(layout.indexOf(before) + 1);
    expect(store.removed()).toEqual([]);
  });

  it('counts owned cards per page', () => {
    const store = makeStore();
    store.setPageOwned(1, true);

    expect(store.pageProgress().get(1)).toEqual({ owned: 16, cards: 16 });
    expect(store.pageProgress().get(2)?.owned).toBe(0);
  });

  it('marks a range of slots in one go', () => {
    const store = makeStore();
    const keys = store
      .slots()
      .slice(3, 9)
      .map((slot) => slot.key);

    store.setRangeOwned(3, 8, true);
    for (const key of keys) expect(store.isOwned(key)).toBe(true);
    expect(store.stats().owned).toBe(6);

    store.setRangeOwned(8, 3, false);
    expect(store.stats().owned).toBe(0);
  });

  it('skips blanks when marking a range', () => {
    const store = makeStore();
    store.insertBlank(4);
    store.setRangeOwned(3, 6, true);
    expect(store.stats().owned).toBe(3);
  });

  it('marks a card by exact name, id or dex number', () => {
    const store = makeStore();

    expect(store.markByName('Charizard-Mega-X')).toEqual(
      expect.objectContaining({
        status: 'marked',
        card: expect.objectContaining({ name: 'Charizard-Mega-X' }),
      }),
    );
    expect(store.stats().owned).toBe(1);

    expect(store.markByName('charizard-mega-x').status).toBe('already');
    expect(store.markByName('bulbasaur').status).toBe('marked');
    expect(store.markByName('#2').status).toBe('marked');
    expect(store.stats().owned).toBe(3);
  });

  it('prefers an exact name over the formes that extend it', () => {
    const store = makeStore();
    const result = store.markByName('charizard');

    expect(result.status).toBe('marked');
    if (result.status !== 'marked') throw new Error('expected marked');
    expect(result.card.name).toBe('Charizard');
    expect(store.stats().owned).toBe(1);
  });

  it('asks which card when a typed name is ambiguous', () => {
    const store = makeStore();
    const result = store.markByName('tauros-paldea');

    expect(result.status).toBe('ambiguous');
    if (result.status !== 'ambiguous') throw new Error('expected ambiguous');
    expect(result.matches.map((card) => card.name)).toEqual([
      'Tauros-Paldea-Combat',
      'Tauros-Paldea-Blaze',
      'Tauros-Paldea-Aqua',
    ]);
    expect(store.stats().owned).toBe(0);
  });

  it('reports a typed name that matches nothing', () => {
    const store = makeStore();
    expect(store.markByName('notapokemon').status).toBe('missing');
    expect(store.markByName('   ').status).toBe('missing');
    expect(store.stats().owned).toBe(0);
  });

  it('never marks a cosmetic variant that is hidden', () => {
    const store = makeStore();
    expect(store.markByName('Arceus-Fire').status).toBe('missing');

    store.setShowCosmetic(true);
    expect(store.markByName('Arceus-Fire').status).toBe('marked');
  });

  it('prints all cards or only the missing ones', () => {
    const store = makeStore();
    store.setPageOwned(1, true);

    expect(store.printScope()).toBe('missing');
    expect(store.printTargets().length).toBe(ACTIVE.length - 16);

    store.setPrintScope('all');
    expect(store.printTargets().length).toBe(ACTIVE.length);
  });

  it('limits printing to a page range', () => {
    const store = makeStore();
    store.setPrintScope('all');
    store.setPrintRange(2, 3);

    const pages = store.printTargets().map((slot) => slot.page);
    expect(Math.min(...pages)).toBe(2);
    expect(Math.max(...pages)).toBe(3);
    expect(store.printTargets().length).toBe(32);
    expect(store.sheets().length).toBe(4);
  });

  it('clamps a print range to the pages that exist', () => {
    const store = makeStore();
    store.setPrintScope('all');
    store.setPrintRange(0, 99999);

    expect(store.printFrom()).toBe(1);
    expect(store.printTo()).toBe(store.stats().pages);

    store.setPrintRange(null, null);
    expect(store.printFrom()).toBeNull();
    expect(store.printTargets().length).toBe(ACTIVE.length);
  });

  it('sorts alphabetically', () => {
    const store = makeStore();
    store.setSort('alpha');

    const names = store.slots().map((slot) => slot.card!.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names.length).toBe(ACTIVE.length);
  });

  it('sorts by type, then dex within a type', () => {
    const store = makeStore();
    store.setSort('type');

    const cards = store.slots().map((slot) => slot.card!);
    expect(cards.length).toBe(ACTIVE.length);
    expect(cards[0].types[0]).toBe('Normal');
    expect(cards[cards.length - 1].types[0]).toBe('Fairy');

    const firstFire = cards.findIndex((card) => card.types[0] === 'Fire');
    const lastFire =
      cards.length -
      1 -
      [...cards].reverse().findIndex((card) => card.types[0] === 'Fire');
    for (let i = firstFire; i <= lastFire; i++) {
      expect(cards[i].types[0]).toBe('Fire');
    }

    const monoFire = cards
      .slice(firstFire, lastFire + 1)
      .filter((card) => card.types.length === 1);
    expect(monoFire[0].num).toBeLessThan(monoFire[1].num);
  });

  it('drops blanks and flags custom when a sort is applied', () => {
    const store = makeStore();
    store.insertBlank(3);
    expect(store.sort()).toBe('custom');

    store.setSort('alpha');

    expect(store.stats().blanks).toBe(0);
    expect(store.sort()).toBe('alpha');
  });

  it('keeps owned marks and removed cards across a sort', () => {
    const store = makeStore();
    const owned = store.slots()[2].card!.id;
    const removed = store.slots()[7].card!.id;
    store.toggleOwned(owned);
    store.removeAt(7);

    store.setSort('alpha');

    expect(store.isOwned(owned)).toBe(true);
    expect(cardIds(store)).not.toContain(removed);
    expect(store.layout().length).toBe(ACTIVE.length - 1);
  });

  it('restores a card into its sorted position, not its dex position', () => {
    const store = makeStore();
    store.setSort('alpha');
    const target = store.slots()[40].card!;
    const before = store.slots()[39].card!.id;

    store.removeAt(40);
    store.restore(target.id);

    const layout = cardIds(store);
    expect(layout.indexOf(target.id)).toBe(layout.indexOf(before) + 1);
  });

  it('undoes and redoes a mark', () => {
    const store = makeStore();
    const key = store.slots()[0].key;

    expect(store.canUndo()).toBe(false);
    store.toggleOwned(key);
    expect(store.isOwned(key)).toBe(true);
    expect(store.canUndo()).toBe(true);

    store.undo();
    expect(store.isOwned(key)).toBe(false);
    expect(store.canRedo()).toBe(true);

    store.redo();
    expect(store.isOwned(key)).toBe(true);
    expect(store.canRedo()).toBe(false);
  });

  it('undoes a sort back to the hand-arranged layout', () => {
    const store = makeStore();
    store.move(0, 5);
    store.insertBlank(2);
    const arranged = store.layout();

    store.setSort('alpha');
    expect(store.layout()).not.toEqual(arranged);

    store.undo();
    expect(store.layout()).toEqual(arranged);
    expect(store.sort()).toBe('custom');
  });

  it('undoes a bulk range mark in one step', () => {
    const store = makeStore();
    store.setRangeOwned(0, 20, true);
    expect(store.stats().owned).toBe(21);

    store.undo();
    expect(store.stats().owned).toBe(0);
  });

  it('drops the redo stack once a new change is made', () => {
    const store = makeStore();
    store.toggleOwned(store.slots()[0].key);
    store.undo();
    expect(store.canRedo()).toBe(true);

    store.toggleOwned(store.slots()[1].key);
    expect(store.canRedo()).toBe(false);
  });

  it('ignores undo and redo when there is no history', () => {
    const store = makeStore();
    const before = store.layout();
    store.undo();
    store.redo();
    expect(store.layout()).toEqual(before);
    expect(store.canUndo()).toBe(false);
  });

  it('does not record history for a no-op', () => {
    const store = makeStore();
    store.setOwned(store.slots()[0].key, false);
    store.removeBlanks();
    store.restoreAll();
    store.setSort('dex');
    expect(store.canUndo()).toBe(false);
  });

  it('persists the sort mode', () => {
    const first = makeStore();
    first.setSort('type');
    const layout = first.layout();

    TestBed.resetTestingModule();
    const second = makeStore();

    expect(second.sort()).toBe('type');
    expect(layoutIds(second)).toEqual(layoutIds(first));
  });

  it('adds a duplicate next to the original and tracks copy numbers', () => {
    const store = makeStore();
    const original = store.slots()[3];

    const key = store.duplicateAt(3);

    expect(key).toBeTruthy();
    expect(store.slots()[4].card!.id).toBe(original.card!.id);
    expect(store.slots()[4].key).not.toBe(original.key);
    expect(store.slots()[3].copy).toBe(1);
    expect(store.slots()[3].copies).toBe(2);
    expect(store.slots()[4].copy).toBe(2);
    expect(store.stats().cards).toBe(ACTIVE.length + 1);
    expect(store.stats().species).toBe(ACTIVE.length);
    expect(store.stats().duplicates).toBe(1);
  });

  it('owns copies independently', () => {
    const store = makeStore();
    store.duplicateAt(3);
    const [first, second] = [store.slots()[3], store.slots()[4]];

    store.toggleOwned(first.key);

    expect(store.isOwned(first.key)).toBe(true);
    expect(store.isOwned(second.key)).toBe(false);
    expect(store.stats().owned).toBe(1);
  });

  it('marks the next unowned copy each time a name is typed', () => {
    const store = makeStore();
    store.duplicateAt(3);
    const name = store.slots()[3].card!.name;

    const first = store.markByName(name);
    const second = store.markByName(name);
    const third = store.markByName(name);

    expect(first.status).toBe('marked');
    expect(second.status).toBe('marked');
    expect(third.status).toBe('already');
    expect(store.stats().owned).toBe(2);
  });

  it('adds a card at a chosen position', () => {
    const store = makeStore();
    const target = ROSTER.find((card) => card.name === 'Charizard')!;

    store.addCard(target.id, 0);

    expect(store.slots()[0].card!.id).toBe(target.id);
    expect(store.stats().cards).toBe(ACTIVE.length + 1);
    expect(store.sort()).toBe('custom');
  });

  it('refuses to add a card that is not in the roster', () => {
    const store = makeStore();
    expect(store.addCard('notamon')).toBeNull();
    expect(store.stats().cards).toBe(ACTIVE.length);
  });

  it('brings a card back out of the removed tray when it is added again', () => {
    const store = makeStore();
    const removed = store.slots()[5].card!.id;
    store.removeAt(5);
    expect(store.removed().map((card) => card.id)).toEqual([removed]);

    store.addCard(removed, 0);

    expect(store.removed()).toEqual([]);
    expect(store.slots()[0].card!.id).toBe(removed);
  });

  it('only hides a species when its last copy is removed', () => {
    const store = makeStore();
    store.duplicateAt(3);
    const id = store.slots()[3].card!.id;

    store.removeAt(4);
    expect(store.removed()).toEqual([]);
    expect(cardIds(store)).toContain(id);

    store.removeAt(3);
    expect(store.removed().map((card) => card.id)).toEqual([id]);
  });

  it('drops the owned mark when a slot is removed', () => {
    const store = makeStore();
    const slot = store.slots()[3];
    store.toggleOwned(slot.key);
    expect(store.stats().owned).toBe(1);

    store.removeAt(3);
    expect(store.owned().has(slot.key)).toBe(false);
    expect(store.stats().owned).toBe(0);
  });

  it('keeps duplicates through a re-sort, side by side', () => {
    const store = makeStore();
    store.duplicateAt(3);
    const id = store.slots()[3].card!.id;

    store.setSort('alpha');

    const positions = store
      .slots()
      .flatMap((slot, index) => (slot.card?.id === id ? [index] : []));
    expect(positions.length).toBe(2);
    expect(positions[1]).toBe(positions[0] + 1);
  });

  it('starts with one binder and can add more', () => {
    const store = makeStore();
    expect(store.binders().length).toBe(1);
    const firstId = store.activeId();

    const secondId = store.createBinder('Trade binder');

    expect(store.binders().length).toBe(2);
    expect(store.activeId()).toBe(secondId);
    expect(store.activeName()).toBe('Trade binder');
    expect(secondId).not.toBe(firstId);
  });

  it('keeps each binder separate', () => {
    const store = makeStore();
    const firstId = store.activeId();
    const firstSlot = store.slots()[0].key;
    store.toggleOwned(firstSlot);
    expect(store.stats().owned).toBe(1);

    store.createBinder('Second');
    expect(store.stats().owned).toBe(0);
    store.toggleOwned(store.slots()[9].key);
    store.setPageGrid(3, 3);

    store.switchTo(firstId);
    expect(store.stats().owned).toBe(1);
    expect(store.isOwned(firstSlot)).toBe(true);
    expect(store.cols()).toBe(4);
  });

  it('can start a new binder as a copy of the current one', () => {
    const store = makeStore();
    store.toggleOwned(store.slots()[0].key);
    store.duplicateAt(2);
    const cards = store.stats().cards;

    store.createBinder('Copy', true);

    expect(store.stats().cards).toBe(cards);
    expect(store.stats().owned).toBe(1);
    expect(store.activeName()).toBe('Copy');
  });

  it('persists every binder and the active one', () => {
    const first = makeStore();
    const originalId = first.activeId();
    first.toggleOwned(first.slots()[0].key);
    first.createBinder('Second');
    first.toggleOwned(first.slots()[4].key);
    const secondId = first.activeId();

    TestBed.resetTestingModule();
    const reloaded = makeStore();

    expect(reloaded.binders().length).toBe(2);
    expect(reloaded.activeId()).toBe(secondId);
    expect(reloaded.stats().owned).toBe(1);

    reloaded.switchTo(originalId);
    expect(reloaded.stats().owned).toBe(1);
  });

  it('renames the active binder', () => {
    const store = makeStore();
    store.renameBinder('  Master set  ');
    expect(store.activeName()).toBe('Master set');
    expect(store.binders()[0].name).toBe('Master set');
  });

  it('refuses to delete the only binder', () => {
    const store = makeStore();
    expect(store.deleteBinder(store.activeId())).toBe(false);
    expect(store.binders().length).toBe(1);
  });

  it('deletes a binder and falls back to another', () => {
    const store = makeStore();
    const firstId = store.activeId();
    store.createBinder('Second');
    const secondId = store.activeId();

    expect(store.deleteBinder(secondId)).toBe(true);
    expect(store.binders().length).toBe(1);
    expect(store.activeId()).toBe(firstId);
  });

  it('migrates a single legacy binder into the multi-binder shape', () => {
    localStorage.setItem(
      'binderData',
      JSON.stringify({
        version: 1,
        layout: ['blank:1', ...ACTIVE_IDS],
        owned: [ACTIVE_IDS[0], ACTIVE_IDS[1]],
        hidden: [],
        pageFormat: '3x3',
      }),
    );

    const store = makeStore();

    expect(store.binders().length).toBe(1);
    expect(store.stats().blanks).toBe(1);
    expect(store.stats().owned).toBe(2);
    expect(store.cols()).toBe(3);
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
  });

  it('reports what is still missing and packs it nine to a sheet', () => {
    const store = makeStore();
    for (const slot of store.slots().slice(0, ACTIVE.length - 10)) {
      store.toggleOwned(slot.key);
    }

    expect(store.missing().length).toBe(10);
    expect(store.sheets().length).toBe(2);
    expect(store.sheets()[0].length).toBe(9);
    expect(store.sheets()[1].length).toBe(1);
  });

  it('restores a saved binder from storage', () => {
    const first = makeStore();
    const owned = first.slots()[2].key;
    first.toggleOwned(owned);
    first.insertBlank(0);
    first.removeAt(9);
    first.setPageGrid(3, 3);

    const savedLayout = first.layout();
    const savedHidden = [...first.hidden()];

    TestBed.resetTestingModule();
    const second = makeStore();

    expect(second.layout()).toEqual(savedLayout);
    expect(second.isOwned(owned)).toBe(true);
    expect([...second.hidden()]).toEqual(savedHidden);
    expect(second.cols()).toBe(3);
    expect(second.rows()).toBe(3);
  });

  it('round-trips through export and import', () => {
    const first = makeStore();
    const owned = first.slots()[4].key;
    first.toggleOwned(owned);
    first.insertBlank(2);
    first.setPageGrid(2, 2);
    const exported = first.exportJson();

    first.clearOwned();
    first.removeBlanks();
    first.setPageGrid(4, 4);

    expect(first.importJson(exported)).toBe(true);
    expect(first.isOwned(owned)).toBe(true);
    expect(first.stats().blanks).toBe(1);
    expect(first.cols()).toBe(2);
    expect(first.rows()).toBe(2);
  });

  it('rejects an import that is not a binder export', () => {
    const store = makeStore();
    expect(store.importJson('not json')).toBe(false);
    expect(store.importJson('{"nope":true}')).toBe(false);
    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
  });

  it('re-inserts roster cards missing from a stale saved layout', () => {
    localStorage.setItem(
      'binderData',
      JSON.stringify({
        layout: [ACTIVE_IDS[0], ACTIVE_IDS[3]],
        owned: [],
        hidden: [],
      }),
    );

    expect(layoutIds(makeStore())).toEqual(ACTIVE_IDS);
  });

  it('migrates a legacy pageFormat string to columns and rows', () => {
    localStorage.setItem(
      'binderData',
      JSON.stringify({
        layout: ACTIVE_IDS,
        owned: [],
        hidden: [],
        pageFormat: '3x4',
      }),
    );

    const store = makeStore();

    expect(store.cols()).toBe(3);
    expect(store.rows()).toBe(4);
    expect(store.pageSize()).toBe(12);
  });

  it('drops unknown and cosmetic ids from a saved layout', () => {
    localStorage.setItem(
      'binderData',
      JSON.stringify({
        layout: ['nosuchmon', 'arceusfire', ...ACTIVE_IDS],
        owned: ['nosuchmon'],
        hidden: [],
      }),
    );

    const store = makeStore();

    expect(layoutIds(store)).toEqual(ACTIVE_IDS);
    expect(store.owned().size).toBe(0);
  });

  it('returns every match in binder order, exact names first', () => {
    const store = makeStore();
    const names = store
      .findMatches('chandelure')
      .map((index) => store.slots()[index].card!.name);

    expect(names).toEqual(['Chandelure', 'Chandelure-Mega']);
  });

  it('puts an exact name ahead of longer partial matches', () => {
    const store = makeStore();
    const names = store
      .findMatches('charizard')
      .map((index) => store.slots()[index].card!.name);

    expect(names[0]).toBe('Charizard');
    expect(names).toContain('Charizard-Mega-X');
    expect(names).toContain('Charizard-Gmax');
  });

  it('matches every slot sharing a dex number', () => {
    const store = makeStore();
    const nums = store
      .findMatches('6')
      .map((index) => store.slots()[index].card!.num);

    expect(nums.length).toBeGreaterThan(1);
    expect(new Set(nums)).toEqual(new Set([6]));
  });

  it('lists duplicate copies as separate matches', () => {
    const store = makeStore();
    const index = store.findMatches('chandelure')[0];
    store.duplicateAt(index);

    const matches = store.findMatches('chandelure');
    expect(matches.length).toBe(3);
    expect(new Set(matches).size).toBe(3);
  });

  it('returns nothing for a term that matches no card', () => {
    const store = makeStore();
    expect(store.findMatches('notapokemon')).toEqual([]);
    expect(store.findMatches('  ')).toEqual([]);
  });

  it('finds a slot by name or dex number', () => {
    const store = makeStore();
    expect(store.slots()[store.findIndex('Charizard-Mega-X')].card?.name).toBe(
      'Charizard-Mega-X',
    );
    expect(store.slots()[store.findIndex('6')].card?.num).toBe(6);
    expect(store.findIndex('definitelynotamon')).toBe(-1);
  });
});
