import { inject, Injectable } from '@angular/core';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import {
  getPidByName,
  getPokemonData,
  isPokemonId,
  SpriteSetKey,
  SpriteSets,
} from '@pdz/shared/data/namedex';

export type SpriteData = {
  path: string;
  fallbackPaths: string[];
  classes: string[];
  flip: boolean;
};

const MEGA_FORME_PATH_ID = /-mega[xyz]?(-|$)/;

function baseFormeIds(id: string): string[] {
  const segments = id.split('-');
  const ids: string[] = [];
  for (let i = segments.length - 1; i > 0; i--) {
    ids.push(segments.slice(0, i).join('-'));
  }
  return ids;
}

@Injectable({
  providedIn: 'root',
})
export class SpriteService {
  private settingsService = inject(SettingsService);

  readonly UNKNOWN_SPRITE_PATH = '../../../../assets/icons/unknown.svg';

  private readonly DEFAULT: SpriteSetKey = 'home';

  /**
   * Gets all the necessary data to display a Pokemon sprite.
   * @param pokemon The Pokemon object, requires at least an 'id'.
   * @returns An object containing the primary path, an ordered list of fallback paths, CSS classes, and flip status.
   */
  public getSpriteData(
    pokemon: Pick<DraftPokemon, 'id' | 'shiny'>,
  ): SpriteData | null {
    let spriteSet = this.settingsService.settings().spriteSet;
    if (!(spriteSet && spriteSet in SpriteSets)) spriteSet = this.DEFAULT;
    const pokemonId = isPokemonId(pokemon.id)
      ? pokemon.id
      : getPidByName(pokemon.id);
    const pokemonData = pokemonId ? getPokemonData(pokemonId) : undefined;
    if (!pokemonId || !pokemonData) return null;
    let config = SpriteSets[spriteSet as SpriteSetKey];
    let props = pokemonData.sources[config.source];
    if (!props && pokemonData.default) {
      config = SpriteSets[pokemonData.default];
      props = pokemonData.sources[config.source];
    }
    if (!props) return null;
    const pathId = props.id ?? pokemonId;
    const shiny = pokemon.shiny || false;
    const path = config.getPath(pathId, shiny);

    const baseIds = baseFormeIds(pathId);
    const setBasePaths = baseIds.map((baseId) => config.getPath(baseId, shiny));
    const fallback = config.fallback?.bind(config);
    const crossSetPath = fallback ? [fallback(pathId, shiny)] : [];
    const crossSetBasePaths = fallback
      ? baseIds.map((baseId) => fallback(baseId, shiny))
      : [];

    const candidates = MEGA_FORME_PATH_ID.test(pathId)
      ? [...setBasePaths, ...crossSetPath, ...crossSetBasePaths]
      : [...crossSetPath, ...setBasePaths, ...crossSetBasePaths];
    const fallbackPaths = [...new Set(candidates)].filter(
      (candidate) => candidate && candidate !== path,
    );
    const classes = [...config.classes];
    const flip = !!(config.flip || props.flip);

    return { path, fallbackPaths, classes, flip };
  }
}
