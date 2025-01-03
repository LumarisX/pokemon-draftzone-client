export const STATS = [
  {
    id: 'hp',
    name: 'HP',
    full: 'HP',
  },
  {
    id: 'atk',
    name: 'Atk',
    full: 'Attack',
  },
  {
    id: 'def',
    name: 'Def',
    full: 'Defense',
  },
  {
    id: 'spa',
    name: 'Spa',
    full: 'Sp. Attack',
  },
  {
    id: 'spd',
    name: 'Spd',
    full: 'Sp. Defense',
  },
  {
    id: 'spe',
    name: 'Spe',
    full: 'Speed',
  },
] as const;

export type Stat = (typeof STATS)[number]['id'];

export type Nature = {
  name: string;
  drop: Stat;
  boost: Stat;
};

export const NATURES: Nature[] = [
  {
    name: 'Hardy',
    drop: 'atk',
    boost: 'atk',
  },
  {
    name: 'Bold',
    drop: 'atk',
    boost: 'def',
  },
  {
    name: 'Modest',
    drop: 'atk',
    boost: 'spa',
  },
  {
    name: 'Calm',
    drop: 'atk',
    boost: 'spd',
  },
  {
    name: 'Timid',
    drop: 'atk',
    boost: 'spe',
  },
  {
    name: 'Lonely',
    drop: 'def',
    boost: 'atk',
  },
  {
    name: 'Docile',
    drop: 'def',
    boost: 'def',
  },
  {
    name: 'Mild',
    drop: 'def',
    boost: 'spa',
  },
  {
    name: 'Gentle',
    drop: 'def',
    boost: 'spd',
  },
  {
    name: 'Hasty',
    drop: 'def',
    boost: 'spe',
  },
  {
    name: 'Adamant',
    drop: 'spa',
    boost: 'atk',
  },
  {
    name: 'Impish',
    drop: 'spa',
    boost: 'def',
  },
  {
    name: 'Bashful',
    drop: 'spa',
    boost: 'spa',
  },
  {
    name: 'Careful',
    drop: 'spa',
    boost: 'spd',
  },
  {
    name: 'Jolly',
    drop: 'spa',
    boost: 'spe',
  },
  {
    name: 'Naughty',
    drop: 'spd',
    boost: 'atk',
  },
  {
    name: 'Lax',
    drop: 'spd',
    boost: 'def',
  },
  {
    name: 'Rash',
    drop: 'spd',
    boost: 'spa',
  },
  {
    name: 'Quirky',
    drop: 'spd',
    boost: 'spd',
  },
  {
    name: 'Naive',
    drop: 'spd',
    boost: 'spe',
  },
  {
    name: 'Brave',
    drop: 'spe',
    boost: 'atk',
  },
  {
    name: 'Relaxed',
    drop: 'spe',
    boost: 'def',
  },
  {
    name: 'Quiet',
    drop: 'spe',
    boost: 'spa',
  },
  {
    name: 'Sassy',
    drop: 'spe',
    boost: 'spd',
  },
  {
    name: 'Serious',
    drop: 'spe',
    boost: 'spe',
  },
];

export const TYPES = [
  'Normal',
  'Grass',
  'Water',
  'Fire',
  'Electric',
  'Ground',
  'Rock',
  'Flying',
  'Ice',
  'Fighting',
  'Poison',
  'Bug',
  'Psychic',
  'Dark',
  'Ghost',
  'Dragon',
  'Steel',
  'Fairy',
] as const;

export const TERATYPES = [...TYPES, 'Stellar'] as const;

export const TYPECONDITIONS = [
  'brn',
  'par',
  'prankster',
  'tox',
  'psn',
  'frz',
  'slp',
  'powder',
  'sandstorm',
  'hail',
  'trapped',
] as const;

export type Type = (typeof TYPES)[number];

export type TeraType = (typeof TERATYPES)[number];

export type ExtendedType = Type | (typeof TYPECONDITIONS)[number];

export type StatsTable = {
  [key in Stat]: number;
};
