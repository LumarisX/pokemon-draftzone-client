import {
  Nature,
  NATURES,
  STATS,
  StatsTable,
  TeraType,
  Type,
  TYPES,
} from '../../data';
import { getPidByName } from '../../data/namedex';
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
  item: string | null = null;
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
  statRange: StatsTable<[number, number]>;
  gender: '' | 'M' | 'F' = '';
  happiness: number = 255;
  hiddenpower: Type = 'Dark';
  gmax: boolean = false;
  shiny: boolean = false;
  dynamaxLevel: number = 255;
  gigantamax: boolean = false;
  moves: (MoveData | null)[] = [null, null, null, null];
  ability: string = '';

  constructor(data: PokemonData & Partial<PokemonSet>) {
    Object.assign(this, data);
    this.level = data.level && data.level > 0 ? data.level : 50;
    this.statRange = {
      hp: this.getStatRange('hp'),
      atk: this.getStatRange('atk'),
      def: this.getStatRange('def'),
      spa: this.getStatRange('spa'),
      spd: this.getStatRange('spd'),
      spe: this.getStatRange('spe'),
    };
  }

  get hp() {
    return calcStat(
      'hp',
      this.baseStats.hp,
      this.ivs.hp,
      this.evs.hp,
      this.level,
      this.nature,
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
    return calcStat(
      stat,
      this.baseStats[stat],
      this.ivs[stat],
      this.evs[stat],
      this.level,
      this.nature,
    );
  }

  private getStatRange(
    stat: 'hp' | 'atk' | 'spa' | 'def' | 'spd' | 'spe',
  ): [number, number] {
    return [
      calcStat(stat, this.baseStats[stat], 0, 0, this.level, this.nature),
      calcStat(stat, this.baseStats[stat], 31, 252, this.level, this.nature),
    ];
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
      item: this.item ?? undefined,
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
    if (this.item) text += ` @ ${this.item}`;
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

  static import(buffer: string) {
    const split = buffer.split('\n').map((line) => line.trim());
    let firstLine: string | undefined = split[0];
    const setOptions: Pokemon & Partial<PokemonSet> = { name: '', id: '' };
    if (!firstLine) throw new Error('Invalid import string');
    [firstLine, setOptions.item] = firstLine.split(' @ ');
    if (firstLine.endsWith(' (M)')) {
      setOptions.gender = 'M';
      firstLine = firstLine.slice(0, -4);
    }
    if (firstLine.endsWith(' (F)')) {
      setOptions.gender = 'F';
      firstLine = firstLine.slice(0, -4);
    }
    let parenIndex = firstLine.lastIndexOf(' (');
    if (firstLine.charAt(firstLine.length - 1) === ')' && parenIndex !== -1) {
      setOptions.name = firstLine.slice(0, parenIndex);
    }
    setOptions.id = getPidByName(setOptions.name) ?? '';
    const lines = split.slice(1);
    lines.forEach((line) => {
      if (line.startsWith('Trait: ')) {
        line = line.slice(7);
        setOptions.ability = line;
      } else if (line.startsWith('Ability: ')) {
        line = line.slice(9);
        setOptions.ability = line;
      } else if (line === 'Shiny: Yes') {
        setOptions.shiny = true;
      } else if (line.startsWith('Level: ')) {
        line = line.slice(7);
        setOptions.level = +line;
      } else if (line.startsWith('Happiness: ')) {
        line = line.slice(11);
        setOptions.happiness = +line;
      } else if (line.startsWith('Hidden Power: ')) {
        line = line.slice(14);
        if (TYPES.includes(line as Type)) setOptions.hiddenpower = line as Type;
      } else if (line.startsWith('Dynamax Level: ')) {
        line = line.slice(15);
        setOptions.dynamaxLevel = +line;
      } else if (line === 'Gigantamax: Yes') {
        setOptions.gigantamax = true;
      } else if (line.startsWith('EVs: ')) {
        line = line.slice(5);
        let evLines = line.split('/');
        setOptions.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        for (let evLine of evLines) {
          evLine = evLine.trim();
          let spaceIndex = evLine.indexOf(' ');
          if (spaceIndex === -1) continue;
          let statid = STATS.find(
            (stat) => stat.id === evLine.slice(spaceIndex + 1).toLowerCase(),
          )?.id;
          if (!statid) continue;
          let statval = parseInt(evLine.slice(0, spaceIndex), 10);
          setOptions.evs[statid] = statval;
        }
      } else if (line.startsWith('IVs: ')) {
        line = line.slice(5);
        let ivLines = line.split(' / ');
        setOptions.ivs = {
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31,
        };
        for (let ivLine of ivLines) {
          ivLine = ivLine.trim();
          let spaceIndex = ivLine.indexOf(' ');
          if (spaceIndex === -1) continue;
          let statid = STATS.find(
            (stat) => stat.id === ivLine.slice(spaceIndex + 1).toLowerCase(),
          )?.id;
          if (!statid) continue;
          let statval = parseInt(ivLine.slice(0, spaceIndex), 10);
          if (isNaN(statval)) statval = 31;
          setOptions.ivs[statid] = statval;
        }
      } else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
        let natureIndex = line.indexOf(' Nature');
        if (natureIndex === -1) natureIndex = line.indexOf(' nature');
        if (natureIndex === -1) return;
        line = line.slice(0, natureIndex);
        if (line !== 'undefined')
          setOptions.nature = NATURES.find((nature) => nature.name === line);
      } else if (line.charAt(0) === '-' || line.charAt(0) === '~') {
        line = line.slice(line.charAt(1) === ' ' ? 2 : 1);
        // if (line.startsWith('Hidden Power [')) {
        //   const hpType = line.slice(14, -1) as Type;
        //   line = 'Hidden Power ' + hpType;
        //   if (!setOptions.ivs && Dex.types.isName(hpType)) {
        //     set.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
        //     const hpIVs = Dex.types.get(hpType).HPivs || {};
        //     for (let stat in hpIVs) {
        //       set.ivs[stat as StatName] = hpIVs[stat as StatName]!;
        //     }
        //   }
        // }
        if (line === 'Frustration' && setOptions.happiness === undefined) {
          setOptions.happiness = 0;
        }
        // if (!setOptions.moves) setOptions.moves = [];
        // setOptions.moves.push(line);
      }
    });
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

export function calcStat(
  stat: 'hp' | 'atk' | 'spa' | 'def' | 'spd' | 'spe',
  baseStat: number,
  ivs: number,
  evs: number,
  level: number,
  nature: Nature | null,
) {
  if (stat === 'hp') {
    return (
      Math.floor(((2 * baseStat + ivs + Math.floor(evs / 4)) * level) / 100) +
      level +
      10
    );
  } else {
    return Math.floor(
      (Math.floor(((2 * baseStat + ivs + Math.floor(evs / 4)) * level) / 100) +
        5) *
        (1 +
          (nature?.boost === stat ? 0.1 : 0) -
          (nature?.drop === stat ? 0.1 : 0)),
    );
  }
}
