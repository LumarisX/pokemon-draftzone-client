import { ForcedOutcome } from './calculator.model';

export interface CalcPresetSide {
  species: string;
  level?: number;
  ability?: string;
  item?: string;
  nature?: string;
  evs?: string;
  boosts?: string;
  status?: string;
  hp?: string;
  teraType?: string;
  terastallized?: boolean;
}

export interface CalcPreset {
  name: string;
  group: string;
  description?: string;
  move: string;
  attacker: CalcPresetSide;
  defender: CalcPresetSide;
  ruleset?: string;
  weather?: string;
  terrain?: string;
  turns?: number;
  hit?: ForcedOutcome;
  crit?: ForcedOutcome;
}

export const CALC_PRESETS: CalcPreset[] = [
  {
    name: 'Blaze Kick',
    group: 'Single hit',
    description: 'Blaziken vs Toxapex',
    move: 'Blaze Kick',
    attacker: { species: 'Blaziken', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Toxapex', evs: 'hp 252, def 252' },
  },
  {
    name: 'Aura Sphere',
    group: 'Single hit',
    description: 'Lucario vs Blissey — the canonical 16-roll case',
    move: 'Aura Sphere',
    attacker: { species: 'Lucario', nature: 'Modest', evs: 'spa 252' },
    defender: { species: 'Blissey', evs: 'hp 252, spd 252' },
  },
  {
    name: 'Aura Sphere into a weakened target',
    group: 'Single hit',
    description: 'Overkill collapses to one certain outcome',
    move: 'Aura Sphere',
    attacker: { species: 'Lucario', nature: 'Modest', evs: 'spa 252' },
    defender: { species: 'Blissey', evs: 'hp 252, spd 252', hp: '10' },
  },
  {
    name: 'Blaze Kick in sun',
    group: 'Field',
    description: 'Weather modifier on the damage path',
    move: 'Blaze Kick',
    attacker: { species: 'Blaziken', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Toxapex', evs: 'hp 252, def 252' },
    weather: 'Sun',
  },
  {
    name: 'Tera Fire Blaze Kick',
    group: 'Field',
    description: 'Terastallized STAB — the 2.0x path',
    move: 'Blaze Kick',
    attacker: {
      species: 'Blaziken',
      nature: 'Adamant',
      evs: 'atk 252',
      teraType: 'Fire',
      terastallized: true,
    },
    defender: { species: 'Toxapex', evs: 'hp 252, def 252' },
  },
  {
    name: '+2 attacker, burned',
    group: 'Field',
    description: 'Boosts and status together',
    move: 'Blaze Kick',
    attacker: {
      species: 'Blaziken',
      nature: 'Adamant',
      evs: 'atk 252',
      boosts: 'atk +2',
      status: 'brn',
    },
    defender: { species: 'Toxapex', evs: 'hp 252, def 252' },
  },
  {
    name: 'Rock Blast',
    group: 'Multi-hit',
    description: 'The 2-5 hit spread, 7/7/3/3',
    move: 'Rock Blast',
    attacker: { species: 'Cloyster', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Icicle Spear + Skill Link',
    group: 'Multi-hit',
    description: 'Skill Link pins the hit count to 5',
    move: 'Icicle Spear',
    attacker: {
      species: 'Cloyster',
      ability: 'Skill Link',
      nature: 'Adamant',
      evs: 'atk 252',
    },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Rock Blast + Loaded Dice',
    group: 'Multi-hit',
    description: 'Loaded Dice narrows the spread to 4-5',
    move: 'Rock Blast',
    attacker: {
      species: 'Cloyster',
      item: 'Loaded Dice',
      nature: 'Adamant',
      evs: 'atk 252',
    },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Triple Axel',
    group: 'Multi-hit',
    description: 'Per-hit accuracy and escalating base power',
    move: 'Triple Axel',
    attacker: { species: 'Weavile', nature: 'Jolly', evs: 'atk 252' },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Population Bomb',
    group: 'Multi-hit',
    description: 'Ten hits — past the exactly representable horizon',
    move: 'Population Bomb',
    attacker: { species: 'Maushold', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Close Combat',
    group: 'Refused',
    description: 'Self effect — attacker stat drops are not modelled yet',
    move: 'Close Combat',
    attacker: { species: 'Lucario', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
  {
    name: 'Brave Bird',
    group: 'Refused',
    description: 'Recoil is not modelled yet',
    move: 'Brave Bird',
    attacker: { species: 'Talonflame', nature: 'Adamant', evs: 'atk 252' },
    defender: { species: 'Blissey', evs: 'hp 252, def 252' },
  },
];
