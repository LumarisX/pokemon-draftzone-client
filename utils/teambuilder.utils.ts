import { Pokemon } from '../src/app/interfaces/pokemon';

export function toPSString(
  pokemon: Pokemon<
    Partial<{
      level: string | number;
      item: string;
      ability: string;
      tera: string;
    }>
  >,
): string {
  let monString = `${pokemon.name}`;
  if (pokemon.item) monString += ` @ ${pokemon.item}`;
  monString += `\n`;
  if (pokemon.ability) monString += `Ability: ${pokemon.ability}\n`;
  if (pokemon.level && pokemon.level !== 100)
    monString += `Level: ${pokemon.level}\n`;
  return monString;
}
