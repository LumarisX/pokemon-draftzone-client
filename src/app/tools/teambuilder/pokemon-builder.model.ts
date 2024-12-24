import { StatsTable, TeraType, Type } from '../../data';
import { Pokemon } from '../../interfaces/draft';

export type TeambuilderPokemon = Pokemon & {
  abilities: string[];
  types: [Type] | [Type, Type];
  baseStats: StatsTable;
  learnset: {
    name: string;
    type: Type;
    category: string;
    effectivePower: number;
    basePower: number;
    accuracy: number | true;
  }[];
  requiredItem?: string;
  requiredAbility?: string;
  requiredItems?: string[];
  requiredMove?: string;
  forceTeraType?: TeraType;
};

export class PokemonBuilder implements TeambuilderPokemon {
  newStats = {
    hp: {
      _ev: 0,
      set ev(value) {
        this._ev = value;
      },
      get ev() {
        return this._ev;
      },
      _iv: 31,
      set iv(value) {
        this._iv = value;
      },
      get iv() {
        return this._iv;
      },
      _stat: 31,
      set stat(value) {
        this._stat = value;
      },
      get stat() {
        return this._stat;
      },
    },
  };
  ivs: StatsTable = {
    hp: 31,
    atk: 31,
    def: 31,
    spa: 31,
    spd: 31,
    spe: 31,
  };
  evs: StatsTable = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  gender: '' = '';
  level: number = 100;
  happiness = 255;
  hiddenpower: string = 'Dark';
  gmax: boolean = false;
  shiny: boolean = false;
  name: string = '';
  nature: string = '';
  moves: [string | null, string | null, string | null, string | null] = [
    null,
    null,
    null,
    null,
  ];
  ability: string = '';
  item: string = '';
  teraType: string = '';
  nickname: string = '';
  id: string = '';
  capt?: { tera?: string[]; z?: boolean } | undefined;
  abilities!: string[];
  types!: [Type] | [Type, Type];
  baseStats!: StatsTable;
  learnset!: {
    id: string;
    name: string;
    type: Type;
    category: string;
    effectivePower: number;
    basePower: number;
    accuracy: number | true;
  }[];
  moveList: {
    name: string;
    value: string;
    basePower: string | number;
    accuracy: string | number;
    typePath: string;
    categoryPath: string;
  }[];
  requiredItem?: string;
  requiredAbility?: string;
  requiredItems?: string[];
  requiredMove?: string;
  forceTeraType?: TeraType;

  constructor(
    pokemon: TeambuilderPokemon,
    options: Partial<PokemonBuilder> = {},
  ) {
    this.ability = pokemon.abilities[0];
    Object.assign(this, pokemon);
    Object.assign(this, options);
    this.moveList = this.learnset.map((move) => ({
      name: move.name,
      value: move.id,
      basePower: move.basePower || '-',
      accuracy: move.accuracy === true ? '-' : move.accuracy,
      typePath: `../../../../assets/icons/types/${move.type}.png`,
      categoryPath: `../../../../assets/icons/moves/move-${move.category.toLowerCase()}.png`,
    }));
  }

  calcStat(stat: keyof StatsTable) {
    const core = Math.floor(
      ((2 * this.baseStats[stat] +
        this.ivs[stat] +
        Math.floor(this.evs[stat] / 4)) *
        this.level) /
        100,
    );
    if (stat === 'hp') return core + this.level + 10;
    else return Math.floor((core + 5) * 1);
  }

  toPacked() {
    return [
      this.nickname,
      this.id,
      this.item,
      this.ability,
      this.moves.join(','),
      this.nature,
      Object.values(this.evs).join(','),
      this.gender,
      Object.values(this.ivs).join(','),
      this.shiny ? 'S' : '',
      this.level,
      [
        this.happiness,
        '',
        this.hiddenpower,
        this.gmax ? 'G' : '',
        '',
        this.teraType,
      ].join(','),
    ].join('|');
  }

  toExport() {
    let string: string;
    if (this.nickname) {
      string = `${this.nickname} (${this.id})`;
    } else {
      string = `${this.id}`;
    }
    if (this.gender != '') string += ` (${this.gender})`;
    if (this.item != '') string += ` @ ${this.item}`;
    string += '\n';
    if (this.ability) string += `Ability: ${this.ability}\n`;
    if (this.level < 100 && this.level > 0) string += `Level: ${this.level}\n`;
    if (this.teraType != '') string += `Tera Type: ${this.teraType}\n`;
    let evs = Object.entries(this.evs)
      .filter((stat) => stat[1] <= 252 && stat[1] > 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (evs.length > 0) string += `EVs: ${evs.join(' / ')}\n`;
    if (this.nature != '') string += `${this.nature} Nature\n`;
    let ivs = Object.entries(this.ivs)
      .filter((stat) => stat[1] < 31 && stat[1] >= 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (ivs.length > 0) string += `IVs: ${ivs.join(' / ')}\n`;
    let moves = this.moves.filter((move) => move != '');
    moves.forEach((move) => {
      string += `- ${move}\n`;
    });
    return string;
  }
}
