import {
  getStatName,
  Nature,
  NATURES,
  STATS,
  StatsTable,
  TeraType,
  TERATYPES,
  Type,
  TYPES,
} from '../../../../../data';
import { getPidByName } from '../../../../../data/namedex';
import { Pokemon } from '../../../../../interfaces/pokemon';

const DEFAULT_LEVEL = 50;
const MAX_LEVEL = 100;
const MAX_HAPPINESS = 255;
const MAX_DYNAMAX_LEVEL = 255;
const MAX_IV = 31;
const MAX_EV = 255;
const DEFAULT_NATURE = NATURES[0]; // Hardy
const DEFAULT_TERATYPE: TeraType = 'Stellar';

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
  readonly category: 'Physical' | 'Special' | 'Status';
  readonly basePower: number | '-';
  readonly accuracy: number | true;
  readonly tags: string[];
  readonly pp: number;
  readonly multihit?: number | [number, number];
  readonly duration?: number;
  readonly desc: string;
  readonly epModifier?: number;
}

export type Move = {
  id: string;
  name: string;
  type: TeraType;
  category: 'Physical' | 'Special' | 'Status';
  basePower: number;
  accuracy: number | '-';
  modified?: { basePower?: true; accuracy?: true; type?: true };
  pp: number;
  desc: string;
  isStab: boolean;
  strength: number;
  tags: string[];
};

export interface PokemonData {
  abilities: string[];
  types: [Type] | [Type, Type];
  baseStats: StatsTable;
  genders: ('M' | 'F')[];
  items: Item[];
  teraType?: TeraType;
}

export type PokemonSetData = Pokemon<{
  nature?: Nature;
  nickname?: string;
  item?: string | null;
  teraType?: TeraType;
  gender?: '' | 'M' | 'F';
  happiness?: number;
  hiddenpower?: Type;
  gmax?: boolean;
  shiny?: boolean;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  moves?: (Move | null)[];
  level?: number;
  stats?: StatsTable<{ ivs: number; evs: number; boosts: number }>;
  ability?: string;
}>;

export class PokemonBuilder {
  id: string;
  name: string;
  types: [Type] | [Type, Type];
  level: number = DEFAULT_LEVEL;
  nature: Nature;
  nickname: string;
  item: string | null;
  teraType: TeraType;
  gender: '' | 'M' | 'F';
  genders: ('M' | 'F')[];
  happiness: number;
  hiddenpower: Type;
  gmax: boolean;
  shiny: boolean;
  dynamaxLevel: number;
  gigantamax: boolean;
  moves: (Move | null)[];
  ability: string;
  stats: StatsTable<{
    base: number;
    ivs: number;
    evs: number;
    boosts: number;
    min: () => number;
    mid: () => number;
    max: () => number;
    get: () => number;
    set: (value: number) => void;
    reset: () => void;
  }>;

  // Team builder properties
  abilities: string[];
  items: Item[];
  teraTypes: readonly TeraType[];

  constructor(
    data: PokemonSetData & {
      types: [Type] | [Type, Type];
      baseStats: StatsTable;
      genders: ('M' | 'F')[];
    },
    teambuilder: {
      abilities?: string[];
      items?: Item[];
      teraType?: TeraType;
    },
  ) {
    this.id = data.id ?? '';
    this.name = data.name ?? '';
    this.types = data.types;
    this.level = data.level && data.level > 0 ? data.level : DEFAULT_LEVEL;
    this.nature = data.nature ?? DEFAULT_NATURE;
    this.nickname = data.nickname ?? '';
    this.item = data.item ?? null;
    this.teraType = data.teraType ?? DEFAULT_TERATYPE;
    this.gender = data.gender ?? '';
    this.happiness = data.happiness ?? MAX_HAPPINESS;
    this.hiddenpower = data.hiddenpower ?? 'Dark';
    this.gmax = data.gmax ?? false;
    this.shiny = data.shiny ?? false;
    this.dynamaxLevel = data.dynamaxLevel ?? MAX_DYNAMAX_LEVEL;
    this.gigantamax = data.gigantamax ?? false;
    this.moves = data.moves ?? [null, null, null, null];
    this.abilities = teambuilder?.abilities ?? [];
    this.genders = data.genders;
    this.items = teambuilder?.items ?? [];
    this.teraTypes = teambuilder?.teraType ? [teambuilder.teraType] : TERATYPES;
    this.ability = data.ability ?? this.abilities[0] ?? '';

    this.stats = {} as typeof this.stats;
    for (const stat of STATS) {
      this.stats[stat.id] = {
        base: data.baseStats[stat.id],
        ivs: data.stats ? data.stats[stat.id].ivs : MAX_IV,
        evs: data.stats ? data.stats[stat.id].evs : 0,
        boosts: data.stats ? data.stats[stat.id].boosts : 0,
        min: () =>
          calcStat(
            stat.id,
            this.stats[stat.id].base,
            0,
            0,
            this.level,
            this.nature,
          ),
        mid: () =>
          calcStat(
            stat.id,
            this.stats[stat.id].base,
            MAX_IV,
            0,
            this.level,
            this.nature,
          ),
        max: () =>
          calcStat(
            stat.id,
            this.stats[stat.id].base,
            MAX_IV,
            MAX_EV,
            this.level,
            this.nature,
          ),
        get: () => this.calcStat(stat.id),
        set: (value: number) => this.calcValue(stat.id, value),
        reset: () => this.resetStat(stat.id),
      };
    }
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
    const min = this.stats[stat].min();
    const max = this.stats[stat].max();
    if (value > max) value = max;
    else if (value < min) value = min;
    if (
      stat !== 'hp' &&
      isJumpPoint(value, getNatureValue(stat, this.nature))
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
    if (a.evs > MAX_EV) a.evs = MAX_EV;
    if (a.ivs > MAX_IV) a.ivs = MAX_IV;
    this.stats[stat].evs = a.evs;
    this.stats[stat].ivs = a.ivs;
  }

  private resetStat(stat: keyof StatsTable) {
    this.stats[stat].ivs = MAX_IV;
    this.stats[stat].evs = 0;
  }

  hasLegalEvs(): boolean {
    const totalEvs =
      this.stats.hp.evs +
      this.stats.atk.evs +
      this.stats.def.evs +
      this.stats.spa.evs +
      this.stats.spd.evs +
      this.stats.spe.evs;
    return totalEvs <= 510;
  }

  getStrength(move: Move): number {
    const accuracy =
      move.accuracy === '-' || move.accuracy > 100 ? 100 : move.accuracy;
    return (move.basePower * accuracy) / 100;
  }

  get evs() {
    return {
      hp: this.stats.hp.evs,
      atk: this.stats.atk.evs,
      def: this.stats.def.evs,
      spa: this.stats.spa.evs,
      spd: this.stats.spd.evs,
      spe: this.stats.spe.evs,
    };
  }

  get ivs() {
    return {
      hp: this.stats.hp.ivs,
      atk: this.stats.atk.ivs,
      def: this.stats.def.ivs,
      spa: this.stats.spa.ivs,
      spd: this.stats.spd.ivs,
      spe: this.stats.spe.ivs,
    };
  }

  get boosts() {
    return {
      hp: this.stats.hp.boosts,
      atk: this.stats.atk.boosts,
      def: this.stats.def.boosts,
      spa: this.stats.spa.boosts,
      spd: this.stats.spd.boosts,
      spe: this.stats.spe.boosts,
    };
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
        ? `${this.nickname.trim()} (${this.name})`
        : `${this.name}`;
    if (this.gender === 'M') text += ` (M)`;
    if (this.gender === 'F') text += ` (F)`;
    if (this.item) text += ` @ ${this.item}`;
    text += `\n`;
    if (this.ability) text += `Ability: ${this.ability}\n`;
    if (this.level !== MAX_LEVEL) text += `Level: ${this.level}\n`;
    if (this.shiny) text += `Shiny: Yes\n`;
    if (this.happiness !== MAX_HAPPINESS)
      text += `Happiness: ${this.happiness}\n`;
    if (this.dynamaxLevel !== MAX_DYNAMAX_LEVEL)
      text += `Dynamax Level: ${this.dynamaxLevel}\n`;
    if (this.gigantamax) text += `Gigantamax: Yes\n`;
    if (this.teraType) text += `Tera Type: ${this.teraType}\n`;
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
    if (evString) text += `EVs: ${evString}\n`;
    if (this.nature) text += `${this.nature.name} Nature\n`;
    const ivString = statsToString(ivs, (v) => v < MAX_IV);
    if (ivString) text += `IVs: ${ivString}\n`;
    for (const move of this.moves) {
      if (!move) continue;
      let moveName = move.name;
      if (moveName.startsWith('Hidden Power ')) {
        const hpType = moveName.slice(13);
        moveName = `Hidden Power[${hpType}]`;
      }
      text += `- ${moveName}\n`;
    }
    return text;
  }

  static import(buffer: string): Partial<PokemonBuilder> {
    const split = buffer.split('\n').map((line) => line.trim());
    let firstLine: string | undefined = split[0];
    const setOptions: Pokemon & Partial<PokemonBuilder> = { name: '', id: '' };
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
            NATURES.find((nature) => nature.name === natureName) ??
            DEFAULT_NATURE;
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
    pokemonData: Pokemon<PokemonData>,
    options: Partial<PokemonBuilder> = {},
  ): PokemonBuilder {
    return new PokemonBuilder(
      {
        ...pokemonData,
        ...options,
      },
      {
        abilities: pokemonData.abilities,
        items: pokemonData.items,
        teraType: pokemonData.teraType,
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
  if (a <= 31) return { ivs: a, evs: 0 };
  return {
    ivs: 31,
    evs: (a - 31) * 4,
  };
}

export function getNatureValue(
  stat: keyof StatsTable,
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
    .map(([k, v]) => `${v} ${getStatName(k) ?? '???'}`)
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

export function isJumpPoint(value: number, natureValue: number): boolean {
  if (natureValue === 1) return false;
  console.log(
    value,
    natureValue,
    Math.ceil(value / natureValue),
    Math.ceil((value + 1) / natureValue),
    Math.ceil(value / natureValue) === Math.ceil((value + 1) / natureValue),
  );
  return (
    Math.ceil(value / natureValue) === Math.ceil((value + 1) / natureValue)
  );
}
