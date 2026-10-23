import { ImportPreview, LeagueTier, NameMatch } from '../tier-list.model';
import {
  initialResolutions,
  initialTiers,
  mergePayload,
  placements,
  rememberedChoices,
  replacePayload,
  rowKey,
} from './import-plan';

function matched(id: string, name: string): NameMatch {
  return { status: 'matched', pokemon: [{ id, name }], via: 'exact' };
}

function preview(): ImportPreview {
  return {
    layout: 'tier-columns',
    layouts: [{ id: 'tier-columns', label: 'One tier per column', tierCount: 3 }],
    tiers: [
      {
        name: 'S',
        cost: 20,
        banned: false,
        untiered: false,
        entries: [
          { text: 'Garchomp', row: 1, col: 0, match: matched('garchomp', 'Garchomp') },
          {
            text: 'Goldengo',
            row: 2,
            col: 0,
            match: { status: 'suggested', pokemon: [{ id: 'gholdengo', name: 'Gholdengo' }] },
          },
        ],
      },
      {
        name: 'A',
        cost: 15,
        banned: false,
        untiered: false,
        entries: [
          {
            text: 'Rotom-W',
            row: 1,
            col: 1,
            note: 'No Trick',
            match: matched('rotomwash', 'Rotom-Wash'),
          },
          { text: 'Garchomp', row: 2, col: 1, match: matched('garchomp', 'Garchomp') },
        ],
      },
      {
        name: 'Banned',
        banned: true,
        untiered: false,
        entries: [{ text: 'Koraidon', row: 1, col: 2, match: matched('koraidon', 'Koraidon') }],
      },
    ],
    duplicates: [{ pokemonId: 'garchomp', name: 'Garchomp', tiers: [0, 1] }],
    counts: {
      total: 5,
      matched: 4,
      suggested: 1,
      ambiguous: 0,
      notInRuleset: 0,
      unmatched: 0,
      duplicates: 1,
    },
    rememberedCount: 0,
  };
}

describe('import plan', () => {
  it('starts with matched names resolved and everything else waiting', () => {
    const resolutions = initialResolutions(preview());

    expect(resolutions.get(rowKey(0, 0))).toEqual([{ id: 'garchomp', name: 'Garchomp' }]);
    expect(resolutions.get(rowKey(0, 1))).toBeNull();
  });

  it('places each Pokémon once, in the tier chosen for duplicates, and lists what was skipped', () => {
    const data = preview();
    const winners = new Map([['garchomp', 1]]);

    const { placed, skipped } = placements(
      data,
      initialTiers(data),
      initialResolutions(data),
      winners,
    );

    expect(placed.map((pokemon) => [pokemon.id, pokemon.tierIndex])).toEqual([
      ['rotomwash', 1],
      ['garchomp', 1],
      ['koraidon', 2],
    ]);
    expect(skipped).toEqual(['Goldengo']);
  });

  it('builds a replace payload that keeps existing tier ids by name and sends bans as banned', () => {
    const data = preview();
    const resolutions = initialResolutions(data);
    resolutions.set(rowKey(0, 1), [{ id: 'gholdengo', name: 'Gholdengo' }]);
    const { placed } = placements(data, initialTiers(data), resolutions, new Map([['garchomp', 0]]));
    const existing: LeagueTier[] = [{ id: 'tier-s', name: 's', cost: 18, pokemon: [] }];

    const payload = replacePayload(initialTiers(data), placed, existing);

    expect(payload).toEqual([
      {
        id: 'tier-s',
        name: 'S',
        cost: 20,
        pokemon: [
          { id: 'garchomp', name: 'Garchomp', notes: undefined },
          { id: 'gholdengo', name: 'Gholdengo', notes: undefined },
        ],
      },
      {
        name: 'A',
        cost: 15,
        pokemon: [{ id: 'rotomwash', name: 'Rotom-Wash', notes: 'No Trick' }],
      },
      {
        name: 'Untiered',
        cost: 0,
        pokemon: [{ id: 'koraidon', name: 'Koraidon', notes: undefined, banned: true }],
      },
    ]);
  });

  it('merges imported Pokémon into the existing list and leaves the rest alone', () => {
    const data = preview();
    const { placed } = placements(
      data,
      initialTiers(data),
      initialResolutions(data),
      new Map([['garchomp', 0]]),
    );
    const existing = [
      {
        id: 'tier-s',
        name: 'S',
        cost: 20,
        pokemon: [{ id: 'kingambit', name: 'Kingambit' }],
      },
      {
        id: 'tier-b',
        name: 'B',
        cost: 10,
        pokemon: [{ id: 'garchomp', name: 'Garchomp' }],
      },
    ] as LeagueTier[];

    const payload = mergePayload(initialTiers(data), placed, existing);
    const byName = Object.fromEntries(
      payload.map((tier) => [tier.name, tier.pokemon.map((pokemon) => pokemon.id)]),
    );

    expect(byName['S']).toEqual(['kingambit', 'garchomp']);
    expect(byName['B']).toEqual([]);
    expect(byName['A']).toEqual(['rotomwash']);
    expect(byName['Untiered']).toEqual(['koraidon']);
  });

  it('remembers only the names a person decided', () => {
    const data = preview();
    const resolutions = initialResolutions(data);
    resolutions.set(rowKey(0, 1), [{ id: 'gholdengo', name: 'Gholdengo' }]);

    expect(rememberedChoices(data, resolutions)).toEqual([
      { text: 'Goldengo', pokemonIds: ['gholdengo'] },
    ]);
  });

  it('skips a tier the person marked as not a tier', () => {
    const data = preview();
    const tiers = initialTiers(data).map((tier, index) =>
      index === 1 ? { ...tier, skip: true } : tier,
    );

    const { placed } = placements(data, tiers, initialResolutions(data), new Map([['garchomp', 0]]));

    expect(placed.map((pokemon) => pokemon.id)).toEqual(['garchomp', 'koraidon']);
  });
});
