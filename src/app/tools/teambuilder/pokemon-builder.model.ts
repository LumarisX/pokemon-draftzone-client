import {
  Nature,
  NATURES,
  STATS,
  StatsTable,
  TeraType,
  TERATYPES,
  Type,
  TYPES,
} from '../../data';
import { getPidByName } from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';

const DEFAULT_LEVEL = 50;
const MAX_LEVEL = 100;
const MAX_HAPPINESS = 255;
const MAX_DYNAMAX_LEVEL = 255;
const MAX_IV = 31;
const MAX_EV = 255;

export interface Item {
  readonly id: string;
  readonly pngId: string;
  readonly name: string;
  readonly desc: string;
  readonly tags: string[];
}

export interface MoveData {
  readonly id: string;
  readonly name: string;
  readonly type: Type;
  readonly category: string;
  readonly effectivePower: number;
  readonly basePower: number;
  readonly accuracy: number | true;
}

export interface TeambuilderPokemon {
  abilities: string[];
  learnset: MoveData[];
  data: Pokemon & {
    types: [Type] | [Type, Type];
    baseStats: StatsTable;
  };
  items: Item[];
  teraType?: TeraType;
}

export class PokemonSet {
  id: string;
  name: string;
  types: [Type] | [Type, Type];
  level: number;
  nature: Nature | null;
  nickname: string;
  item: string | null;
  teraType: TeraType | null;
  boosts: Partial<StatsTable>;
  gender: '' | 'M' | 'F';
  happiness: number;
  hiddenpower: Type;
  gmax: boolean;
  shiny: boolean;
  dynamaxLevel: number;
  gigantamax: boolean;
  moves: (MoveData | null)[];
  ability: string;
  stats: StatsTable<{
    base: number;
    ivs: number;
    evs: number;
    range: () => [number, number];
    get: () => number;
    set: (value: number) => void;
  }>;

  // Team builder properties
  abilities: string[];
  learnset: MoveData[];
  items: Item[];
  teraTypes: readonly TeraType[];
  moveList: Array<{
    name: string;
    id: string;
    basePower: string | number;
    accuracy: string | number;
    typePath: string;
    categoryPath: string;
  }>;

  constructor(
    data: Pokemon & {
      types: [Type] | [Type, Type];
      baseStats: StatsTable;
    } & Partial<PokemonSet> & { ivs?: StatsTable; evs?: StatsTable },
    teambuilder?: {
      abilities?: string[];
      learnset?: MoveData[];
      items?: Item[];
      teraType?: TeraType;
    },
  ) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.types = data.types;
    this.level = data.level && data.level > 0 ? data.level : DEFAULT_LEVEL;
    this.nature = data.nature ?? null;
    this.nickname = data.nickname ?? '';
    this.item = data.item ?? null;
    this.teraType = data.teraType ?? null;
    this.boosts = data.boosts ?? { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.gender = data.gender ?? '';
    this.happiness = data.happiness ?? MAX_HAPPINESS;
    this.hiddenpower = data.hiddenpower ?? 'Dark';
    this.gmax = data.gmax ?? false;
    this.shiny = data.shiny ?? false;
    this.dynamaxLevel = data.dynamaxLevel ?? MAX_DYNAMAX_LEVEL;
    this.gigantamax = data.gigantamax ?? false;
    this.moves = data.moves ?? [null, null, null, null];

    // Initialize team builder properties
    this.abilities = teambuilder?.abilities ?? data.abilities ?? [];
    this.learnset = teambuilder?.learnset ?? data.learnset ?? [];
    this.items = teambuilder?.items ?? data.items ?? [];
    this.teraTypes = teambuilder?.teraType
      ? [teambuilder.teraType]
      : (data.teraTypes ?? TERATYPES);
    this.ability = data.ability ?? this.abilities[0] ?? '';
    this.moveList = this.learnset.map((move) => ({
      name: move.name,
      id: move.id,
      basePower: move.basePower || '-',
      accuracy: move.accuracy === true ? '-' : move.accuracy,
      typePath: `../../../../assets/icons/types/${move.type}.png`,
      categoryPath: `../../../../assets/icons/moves/move-${move.category.toLowerCase()}.png`,
    }));

    this.stats = {
      hp: {
        base: data.baseStats.hp,
        ivs: data.ivs?.hp ?? MAX_IV,
        evs: data.evs?.hp ?? 0,
        range: () => this.getStatRange('hp'),
        get: () => this.calcStat('hp'),
        set: (value: number) => {
          this.calcValue('hp', value);
        },
      },
      atk: {
        base: data.baseStats.atk,
        ivs: data.ivs?.atk ?? MAX_IV,
        evs: data.evs?.atk ?? 0,
        range: () => this.getStatRange('atk'),
        get: () => this.calcStat('atk'),
        set: (value: number) => {
          this.calcValue('atk', value);
        },
      },
      def: {
        base: data.baseStats.def,
        ivs: data.ivs?.def ?? MAX_IV,
        evs: data.evs?.def ?? 0,
        range: () => this.getStatRange('def'),
        get: () => this.calcStat('def'),
        set: (value: number) => {
          this.calcValue('def', value);
        },
      },
      spa: {
        base: data.baseStats.spa,
        ivs: data.ivs?.spa ?? MAX_IV,
        evs: data.evs?.spa ?? 0,
        range: () => this.getStatRange('spa'),
        get: () => this.calcStat('spa'),
        set: (value: number) => {
          this.calcValue('spa', value);
        },
      },
      spd: {
        base: data.baseStats.spd,
        ivs: data.ivs?.spd ?? MAX_IV,
        evs: data.evs?.spd ?? 0,
        range: () => this.getStatRange('spd'),
        get: () => this.calcStat('spd'),
        set: (value: number) => {
          this.calcValue('spd', value);
        },
      },
      spe: {
        base: data.baseStats.spe,
        ivs: data.ivs?.spe ?? MAX_IV,
        evs: data.evs?.spe ?? 0,
        range: () => this.getStatRange('spe'),
        get: () => this.calcStat('spe'),
        set: (value: number) => {
          this.calcValue('spe', value);
        },
      },
    };
  }

  private calcStat(stat: keyof StatsTable) {
    return calcStat(
      stat,
      this.stats[stat].base,
      this.stats[stat].ivs,
      this.stats[stat].evs,
      this.level,
      this.nature,
    );
  }

  private calcValue(stat: keyof StatsTable, value: number) {
    if (
      stat !== 'hp' &&
      this.isJumpPoint(value, getNatureValue(stat, this.nature))
    ) {
      if (value > this.stats[stat].get()) value = value + 1;
      else if (value < this.stats[stat].get()) value = value - 1;
    }
    const a = calcValues(
      stat,
      value,
      this.stats[stat].base,
      this.level,
      this.nature,
    );
    this.stats[stat].evs = a.evs;
    this.stats[stat].ivs = a.ivs;
  }

  private isJumpPoint(value: number, natureValue: number): boolean {
    if (natureValue === 1) return false;
    return (
      Math.ceil(value / natureValue) === Math.ceil((value + 1) / natureValue)
    );
  }
  private getStatRange(stat: keyof StatsTable): [number, number] {
    return [
      calcStat(stat, this.stats[stat].base, 0, 0, this.level, this.nature),
      calcStat(
        stat,
        this.stats[stat].base,
        MAX_IV,
        252,
        this.level,
        this.nature,
      ),
    ];
  }

  toJson() {
    const extractStats = (key: 'ivs' | 'evs') => {
      return {
        hp: this.stats.hp[key],
        atk: this.stats.atk[key],
        def: this.stats.def[key],
        spa: this.stats.spa[key],
        spd: this.stats.spd[key],
        spe: this.stats.spe[key],
      };
    };
    return {
      name: this.name,
      ivs: filterStats(extractStats('ivs'), (v) => v < MAX_IV && v >= 0),
      evs: filterStats(extractStats('evs'), (v) => v <= MAX_EV && v > 0),
      item: this.item ?? undefined,
      level: this.level > 0 && this.level < MAX_LEVEL ? this.level : MAX_LEVEL,
      nature:
        !this.nature || this.nature.boost === this.nature.drop
          ? undefined
          : this.nature.name,
      teraType: this.teraType ?? undefined,
      gigantamax: this.gigantamax || undefined,
      happiness:
        this.happiness < MAX_HAPPINESS && this.happiness >= 0
          ? this.happiness
          : undefined,
      dynamaxLevel:
        this.dynamaxLevel < MAX_DYNAMAX_LEVEL && this.dynamaxLevel >= 0
          ? this.dynamaxLevel
          : undefined,
      moves: this.moves.filter(Boolean).map((move) => move!.name),
      ability: this.ability,
      gender: this.gender === '' ? undefined : this.gender,
    };
  }

  export(): string {
    let text = '';
    text +=
      this.nickname && this.nickname !== this.name
        ? `${this.nickname} (${this.name})`
        : `${this.name}`;
    if (this.gender === 'M') text += ` (M)`;
    if (this.gender === 'F') text += ` (F)`;
    if (this.item) text += ` @ ${this.item}`;
    text += `  \n`;
    if (this.ability) text += `Ability: ${this.ability}  \n`;
    for (const move of this.moves) {
      if (!move) continue;
      let moveName = move.name;
      if (moveName.startsWith('Hidden Power ')) {
        const hpType = moveName.slice(13);
        moveName = `Hidden Power[${hpType}]`;
      }
      text += `- ${moveName}  \n`;
    }
    const evs = {
      hp: this.stats.hp.evs,
      atk: this.stats.atk.evs,
      def: this.stats.def.evs,
      spa: this.stats.spa.evs,
      spd: this.stats.spd.evs,
      spe: this.stats.spe.evs,
    };
    const ivs = {
      hp: this.stats.hp.ivs,
      atk: this.stats.atk.ivs,
      def: this.stats.def.ivs,
      spa: this.stats.spa.ivs,
      spd: this.stats.spd.ivs,
      spe: this.stats.spe.ivs,
    };
    const evString = statsToString(evs, (v) => v > 0);
    if (evString) text += `EVs: ${evString} \n`;
    if (this.nature) text += `${this.nature.name} Nature  \n`;
    const ivString = statsToString(ivs, (v) => v < MAX_IV);
    if (ivString) text += `IVs: ${ivString} \n`;
    if (this.level !== MAX_LEVEL) text += `Level: ${this.level}  \n`;
    if (this.shiny) text += `Shiny: Yes  \n`;
    if (this.happiness !== MAX_HAPPINESS)
      text += `Happiness: ${this.happiness}  \n`;
    if (this.dynamaxLevel !== MAX_DYNAMAX_LEVEL)
      text += `Dynamax Level: ${this.dynamaxLevel}  \n`;
    if (this.gigantamax) text += `Gigantamax: Yes  \n`;
    text += `\n`;
    return text;
  }

  static import(buffer: string): Partial<PokemonSet> {
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
    } else {
      setOptions.name = firstLine;
    }
    setOptions.id = getPidByName(setOptions.name) ?? '';
    const lines = split.slice(1);
    for (const lineRaw of lines) {
      let line = lineRaw;
      if (line.startsWith('Trait: ')) {
        setOptions.ability = line.slice(7);
      } else if (line.startsWith('Ability: ')) {
        setOptions.ability = line.slice(9);
      } else if (line === 'Shiny: Yes') {
        setOptions.shiny = true;
      } else if (line.startsWith('Level: ')) {
        setOptions.level = +line.slice(7);
      } else if (line.startsWith('Happiness: ')) {
        setOptions.happiness = +line.slice(11);
      } else if (line.startsWith('Hidden Power: ')) {
        const hpType = line.slice(14);
        if (TYPES.includes(hpType as Type))
          setOptions.hiddenpower = hpType as Type;
      } else if (line.startsWith('Dynamax Level: ')) {
        setOptions.dynamaxLevel = +line.slice(15);
      } else if (line === 'Gigantamax: Yes') {
        setOptions.gigantamax = true;
      } else if (line.startsWith('EVs: ')) {
        if (!setOptions.stats) setOptions.stats = {} as any;
        const evs = parseStats(line.slice(5), 0);
        (['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).forEach((stat) => {
          if (!setOptions.stats![stat]) setOptions.stats![stat] = {} as any;
          setOptions.stats![stat].evs = evs[stat];
        });
      } else if (line.startsWith('IVs: ')) {
        if (!setOptions.stats) setOptions.stats = {} as any;
        const ivs = parseStats(line.slice(5), MAX_IV);
        (['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const).forEach((stat) => {
          if (!setOptions.stats![stat]) setOptions.stats![stat] = {} as any;
          setOptions.stats![stat].ivs = ivs[stat];
        });
      } else if (line.match(/^[A-Za-z]+ (N|n)ature/)) {
        let natureIndex = line.indexOf(' Nature');
        if (natureIndex === -1) natureIndex = line.indexOf(' nature');
        if (natureIndex === -1) continue;
        const natureName = line.slice(0, natureIndex);
        if (natureName !== 'undefined')
          setOptions.nature =
            NATURES.find((nature) => nature.name === natureName) ?? null;
      } else if (line.charAt(0) === '-' || line.charAt(0) === '~') {
        const moveName = line.slice(line.charAt(1) === ' ' ? 2 : 1);
        if (moveName === 'Frustration' && setOptions.happiness === undefined) {
          setOptions.happiness = 0;
        }
      }
    }
    return setOptions;
  }

  static fromTeambuilder(
    pokemon: TeambuilderPokemon,
    options: Partial<PokemonSet> = {},
  ): PokemonSet {
    return new PokemonSet(
      {
        ...pokemon.data,
        ...options,
      },
      {
        abilities: pokemon.abilities,
        learnset: pokemon.learnset,
        items: pokemon.items,
        teraType: pokemon.teraType,
      },
    );
  }
}

export function calcStat(
  stat: keyof StatsTable,
  baseStat: number,
  ivs: number,
  evs: number,
  level: number,
  nature: Nature | null,
): number {
  if (stat === 'hp') {
    return (
      Math.floor(((2 * baseStat + ivs + Math.floor(evs / 4)) * level) / 100) +
      level +
      10
    );
  }
  return Math.floor(
    (Math.floor(((2 * baseStat + ivs + Math.floor(evs / 4)) * level) / 100) +
      5) *
      getNatureValue(stat, nature),
  );
}

export function calcValues(
  stat: keyof StatsTable,
  totalStat: number,
  baseStat: number,
  level: number,
  nature: Nature | null,
): { ivs: number; evs: number } {
  let a = 0;
  if (stat === 'hp') {
    a = (100 / level) * (totalStat - level - 10) - 2 * baseStat;
  } else {
    const natureValue =
      nature?.boost === nature?.drop
        ? 1
        : nature?.boost === stat
          ? 1.1
          : nature?.drop === stat
            ? 0.9
            : 1;
    a = (Math.ceil(totalStat / natureValue - 5) * 100) / level - 2 * baseStat;
  }
  console.log(a);
  if (a <= 31) return { ivs: a, evs: 0 };
  return {
    ivs: 31,
    evs: (a - 31) * 4,
  };
}

function getNatureValue(
  stat: keyof Omit<StatsTable, 'hp'>,
  nature: Nature | null,
): number {
  if (!nature) return 1;
  if (nature.boost === nature.drop) return 1;
  if (nature.boost === stat) return 1.1;
  if (nature.drop === stat) return 0.9;
  return 1;
}

function filterStats(
  stats: StatsTable,
  predicate: (v: number) => boolean,
): Partial<StatsTable> {
  return Object.fromEntries(
    Object.entries(stats).filter(([_, v]) => predicate(v)),
  );
}

function statsToString(
  stats: StatsTable,
  predicate: (v: number) => boolean,
): string {
  return Object.entries(stats)
    .filter(([_, v]) => predicate(v))
    .map(([k, v]) => `${v} ${k.toUpperCase()}`)
    .join(' / ');
}

function parseStats(line: string, defaultValue: number): StatsTable {
  const stats: StatsTable = {
    hp: defaultValue,
    atk: defaultValue,
    def: defaultValue,
    spa: defaultValue,
    spd: defaultValue,
    spe: defaultValue,
  };
  const statEntries = line.split('/');
  for (const entry of statEntries) {
    const trimmed = entry.trim();
    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) continue;
    const statKey = trimmed.slice(spaceIndex + 1).toLowerCase();
    const statVal = parseInt(trimmed.slice(0, spaceIndex), 10);
    if (STATS.some((stat) => stat.id === statKey)) {
      stats[statKey as keyof StatsTable] = isNaN(statVal)
        ? defaultValue
        : statVal;
    }
  }
  return stats;
}
