import { Nature, StatsTable, TeraType, Type } from '../../data';
import { Pokemon } from '../../interfaces/draft';

type Item = {
  id: string;
  pngId: string;
  name: string;
  desc: string;
  tags: string[];
};

type PokemonData = Pokemon & {
  types: [Type] | [Type, Type];
  baseStats: StatsTable;
};

export type TeambuilderPokemon = {
  abilities: string[];
  learnset: {
    id: string;
    name: string;
    type: Type;
    category: string;
    effectivePower: number;
    basePower: number;
    accuracy: number | true;
  }[];
  data: PokemonData;
  items: Item[];
};

export class PokemonSet implements PokemonData {
  id!: string;
  name!: string;
  level: number;
  baseStats!: StatsTable;
  types!: [Type] | [Type, Type];
  nature: Nature | null = null;
  nickname: string = '';
  item: Item | null = null;
  teraType: TeraType | null = null;
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
  boosts: Partial<StatsTable> = {
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  gender: '' | 'M' | 'F' = '';
  happiness: number = 255;
  hiddenpower: Type = 'Dark';
  gmax: boolean = false;
  shiny: boolean = false;
  dynamaxLevel: number = 255;
  gigantamax: boolean = false;
  moves: [MoveData | null, MoveData | null, MoveData | null, MoveData | null] =
    [null, null, null, null];
  ability: string = '';

  constructor(data: PokemonData & Partial<PokemonSet>) {
    Object.assign(this, data);
    this.level = data.level && data.level > 0 ? data.level : 50;
  }

  get hp() {
    return (
      Math.floor(
        ((2 * this.baseStats.hp + this.ivs.hp + Math.floor(this.evs.hp / 4)) *
          this.level) /
          100,
      ) +
      this.level +
      10
    );
  }
  get atk() {
    return this.calcStat('atk');
  }
  get def() {
    return this.calcStat('def');
  }
  get spa() {
    return this.calcStat('spa');
  }
  get spd() {
    return this.calcStat('spd');
  }
  get spe() {
    return this.calcStat('spe');
  }

  private calcStat(stat: 'atk' | 'spa' | 'def' | 'spd' | 'spe') {
    return Math.floor(
      (Math.floor(
        ((2 * this.baseStats[stat] +
          this.ivs[stat] +
          Math.floor(this.evs[stat] / 4)) *
          this.level) /
          100,
      ) +
        5) *
        (1 +
          (this.nature?.boost === stat ? 0.1 : 0) -
          (this.nature?.drop === stat ? 0.1 : 0)),
    );
  }

  toJson() {
    return {
      name: this.name,
      ivs: Object.fromEntries(
        Object.entries(this.ivs).filter((iv) => iv[1] < 31 && iv[1] >= 0),
      ),
      evs: Object.fromEntries(
        Object.entries(this.evs).filter((ev) => ev[1] <= 255 && ev[1] > 0),
      ),
      item: this.item ? this.item.name : undefined,
      level: this.level > 0 && this.level < 100 ? this.level : 100,
      nature:
        !this.nature || this.nature.boost === this.nature.drop
          ? undefined
          : this.nature.name,
      teraType: this.teraType || undefined,
      gigantamax: this.gigantamax || undefined,
      happiness:
        this.happiness < 255 && this.happiness >= 0
          ? this.happiness
          : undefined,
      dynamaxLevel:
        this.dynamaxLevel < 255 && this.dynamaxLevel >= 0
          ? this.dynamaxLevel
          : undefined,
      moves: this.moves
        .filter((move) => move !== null)
        .map((move) => move.name),
      ability: this.ability,
      gender: this.gender === '' ? undefined : this.gender,
    };
  }

  export() {
    let text = '';
    if (this.nickname != '' && this.nickname !== this.name)
      text += `${this.nickname} (${this.name})`;
    else text += `${this.name}`;
    if (this.gender === 'M') text += ` (M)`;
    if (this.gender === 'F') text += ` (F)`;
    if (this.item) text += ` @ ${this.item.name}`;
    text += `  \n`;
    if (this.ability) text += `Ability: ${this.ability}  \n`;
    for (let move of this.moves) {
      let moveName = move?.name;
      if (moveName && moveName.substring(0, 13) === 'Hidden Power ') {
        const hpType = moveName.slice(13);
        moveName = moveName.slice(0, 13);
        moveName = `${moveName}[${hpType}]`;
      }

      if (move) text += `- ${moveName}  \n`;
    }
    const evString = Object.entries(this.evs)
      .filter((stat) => stat[1] > 0)
      .map((stat) => `${stat[1]} ${stat[0].toUpperCase()}`)
      .join(` / `);
    if (evString != '') text += `EVs: ${evString} \n`;
    if (this.nature) text += `${this.nature.name} Nature  \n`;
    const ivString = Object.entries(this.ivs)
      .filter((stat) => stat[1] < 31)
      .map((stat) => `${stat[1]} ${stat[0].toUpperCase()}`)
      .join(` / `);
    if (ivString != '') text += `IVs: ${ivString} \n`;
    if (this.level !== 100) text += `Level: ${this.level}  \n`;
    if (this.shiny) text += `Shiny: Yes  \n`;
    if (this.happiness !== 255) text += `Happiness: ${this.happiness}  \n`;
    if (this.dynamaxLevel !== 255)
      text += `Dynamax Level: ${this.dynamaxLevel}  \n`;
    if (this.gigantamax) text += `Gigantamax: Yes  \n`;
    text += `\n`;
    return text;
  }
}
export type MoveData = {
  id: string;
  name: string;
  type: Type;
  category: string;
  effectivePower: number;
  basePower: number;
  accuracy: number | true;
};

export class PokemonBuilder {
  items: Item[] = [];
  abilities!: string[];
  set: PokemonSet;
  learnset!: MoveData[];
  moveList: {
    name: string;
    id: string;
    basePower: string | number;
    accuracy: string | number;
    typePath: string;
    categoryPath: string;
  }[];

  constructor(pokemon: TeambuilderPokemon) {
    this.abilities = pokemon.abilities;
    this.set = new PokemonSet({
      ...pokemon.data,
      ability: this.abilities[0],
    });
    this.learnset = pokemon.learnset;
    this.items = pokemon.items;
    this.moveList = this.learnset.map((move) => ({
      name: move.name,
      id: move.id,
      basePower: move.basePower || '-',
      accuracy: move.accuracy === true ? '-' : move.accuracy,
      typePath: `../../../../assets/icons/types/${move.type}.png`,
      categoryPath: `../../../../assets/icons/moves/move-${move.category.toLowerCase()}.png`,
    }));
  }

  // toPacked() {
  //   return [
  //     this.nickname,
  //     this.id,
  //     this.item,
  //     this.ability,
  //     this.moves.join(','),
  //     this.nature,
  //     Object.values(this.evs).join(','),
  //     this.gender,
  //     Object.values(this.ivs).join(','),
  //     this.shiny ? 'S' : '',
  //     this.level,
  //     [
  //       this.happiness,
  //       '',
  //       this.hiddenpower,
  //       this.gmax ? 'G' : '',
  //       '',
  //       this.teraType,
  //     ].join(','),
  //   ].join('|');
  // }
}
