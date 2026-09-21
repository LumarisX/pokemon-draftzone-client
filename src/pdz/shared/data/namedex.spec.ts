import {
  getNameByPid,
  getPidByName,
  isPokemonId,
  nameList,
} from '@pdz/shared/data/namedex';

describe('namedex', () => {
  describe('isPokemonId', () => {
    it('accepts a real id', () => {
      expect(isPokemonId('meowstic')).toBe(true);
    });

    it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
      'rejects the inherited key %s',
      (key) => {
        expect(isPokemonId(key)).toBe(false);
      },
    );
  });

  describe('getNameByPid', () => {
    it('returns the display name', () => {
      expect(getNameByPid('lycanroc')).toBe('Lycanroc');
    });

    it('falls back to the id when unknown', () => {
      expect(getNameByPid('notapokemon')).toBe('notapokemon');
    });
  });

  describe('display names', () => {
    it('round-trip back to their own id', () => {
      const broken = nameList()
        .filter(({ id, name }) => getPidByName(name) !== id)
        .map(({ id, name }) => `${id} -> ${name} -> ${getPidByName(name)}`);
      expect(broken).toEqual([]);
    });
  });

  describe('getPidByName', () => {
    it.each([
      ['Meowstic-M', 'meowstic'],
      ['Meowstic-Male', 'meowstic'],
      ['Meowstic-F', 'meowsticf'],
      ['Indeedee-Male', 'indeedee'],
      ['Basculegion-M', 'basculegion'],
      ['Oinkologne-Male', 'oinkologne'],
      ['Nidoran-Male', 'nidoranm'],
      ['Nidoran-Female', 'nidoranf'],
    ])('resolves the gendered name %s', (name, id) => {
      expect(getPidByName(name)).toBe(id);
    });

    it.each([
      ['Lycanroc-Midday', 'lycanroc'],
      ['Lycanroc-Midnight', 'lycanrocmidnight'],
      ['Urshifu-Single-Strike', 'urshifu'],
      ['Urshifu-Rapid-Strike', 'urshifurapidstrike'],
      ['Toxtricity-Amped', 'toxtricity'],
      ['Toxtricity-Low-Key', 'toxtricitylowkey'],
      ['Basculin-Red-Striped', 'basculin'],
      ['Zygarde-50%', 'zygarde'],
      ['Ogerpon-Teal', 'ogerpon'],
    ])('resolves the base forme name %s', (name, id) => {
      expect(getPidByName(name)).toBe(id);
    });

    it.each([
      ['Unown-Q', 'unown'],
      ['Vivillon-Modern', 'vivillon'],
      ['Alcremie-Ruby-Cream', 'alcremie'],
      ['Flabébé-Blue', 'flabebe'],
      ['Flabebe-Blue', 'flabebe'],
    ])('resolves the cosmetic forme name %s', (name, id) => {
      expect(getPidByName(name)).toBe(id);
    });

    it('is undefined for an unknown name', () => {
      expect(getPidByName('Notapokemon')).toBeUndefined();
    });
  });
});
