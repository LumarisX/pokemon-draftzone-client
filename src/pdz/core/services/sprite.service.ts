import { inject, Injectable } from '@angular/core';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import {
  getPokemonData,
  SpriteSetKey,
  SpriteSets,
} from '@pdz/shared/data/namedex';

export type SpriteData = {
  path: string;
  fallbackPaths: string[];
  classes: string[];
  flip: boolean;
};

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
    const pokemonData = getPokemonData(pokemon.id);
    if (!pokemonData) return null;
    let config = SpriteSets[spriteSet as SpriteSetKey];
    let props = pokemonData.sources[config.source];
    if (!props && pokemonData.default) {
      config = SpriteSets[pokemonData.default];
      props = pokemonData.sources[config.source];
    }
    if (!props) return null;
    const pathId = props.id ?? pokemon.id;
    const shiny = pokemon.shiny || false;
    const path = config.getPath(pathId, shiny);

    const candidates = [
      ...(config.fallback ? [config.fallback(pathId, shiny)] : []),
      ...baseFormeIds(pathId).map((baseId) => config.getPath(baseId, shiny)),
    ];
    const fallbackPaths = [...new Set(candidates)].filter(
      (candidate) => candidate && candidate !== path,
    );
    const classes = [...config.classes];
    const flip = !!(config.flip || props.flip);

    return { path, fallbackPaths, classes, flip };
  }
}
