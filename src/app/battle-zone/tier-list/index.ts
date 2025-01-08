import { Namedex, PokemonId } from '../../data/namedex';
type Tier = { cost: number; noTera?: boolean };

const SET_TIERS: { [key: PokemonId]: Tier } = {};

export const TIERS = Object.keys(Namedex).reduce((acc, key) => {
  acc[key] = { cost: 0 };
  return acc;
}, {} as { [key: string]: Tier });
