type Stat = 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe';

export const natures: {
  [key: string]: {
    name: string;
    drop: Stat;
    boost: Stat;
  };
} = {
  hardy: {
    name: 'Hardy',
    drop: 'atk',
    boost: 'atk',
  },
  bold: {
    name: 'Bold',
    drop: 'atk',
    boost: 'def',
  },
  modest: {
    name: 'Modest',
    drop: 'atk',
    boost: 'spa',
  },
  calm: {
    name: 'Calm',
    drop: 'atk',
    boost: 'spd',
  },
  timid: {
    name: 'Timid',
    drop: 'atk',
    boost: 'spe',
  },
  lonely: {
    name: 'Lonely',
    drop: 'def',
    boost: 'atk',
  },
  docile: {
    name: 'Docile',
    drop: 'def',
    boost: 'def',
  },
  mild: {
    name: 'Mild',
    drop: 'def',
    boost: 'spa',
  },
  gentle: {
    name: 'Gentle',
    drop: 'def',
    boost: 'spd',
  },
  hasty: {
    name: 'Hasty',
    drop: 'def',
    boost: 'spe',
  },
  adamant: {
    name: 'Adamant',
    drop: 'spa',
    boost: 'atk',
  },
  impish: {
    name: 'Impish',
    drop: 'spa',
    boost: 'def',
  },
  bashful: {
    name: 'Bashful',
    drop: 'spa',
    boost: 'spa',
  },
  careful: {
    name: 'Careful',
    drop: 'spa',
    boost: 'spd',
  },
  jolly: {
    name: 'Jolly',
    drop: 'spa',
    boost: 'spe',
  },
  naughty: {
    name: 'Naughty',
    drop: 'spd',
    boost: 'atk',
  },
  lax: {
    name: 'Lax',
    drop: 'spd',
    boost: 'def',
  },
  rash: {
    name: 'Rash',
    drop: 'spd',
    boost: 'spa',
  },
  quirky: {
    name: 'Quirky',
    drop: 'spd',
    boost: 'spd',
  },
  naive: {
    name: 'Naive',
    drop: 'spd',
    boost: 'spe',
  },
  brave: {
    name: 'Brave',
    drop: 'spe',
    boost: 'atk',
  },
  relaxed: {
    name: 'Relaxed',
    drop: 'spe',
    boost: 'def',
  },
  quiet: {
    name: 'Quiet',
    drop: 'spe',
    boost: 'spa',
  },
  sassy: {
    name: 'Sassy',
    drop: 'spe',
    boost: 'spd',
  },
  serious: {
    name: 'Serious',
    drop: 'spe',
    boost: 'spe',
  },
};
