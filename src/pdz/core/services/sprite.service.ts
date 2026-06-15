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
  fallbackPath?: string;
  classes: string[];
  flip: boolean;
};

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
   * @returns An object containing the primary path, a potential fallback path, CSS classes, and flip status.
   */
  public getSpriteData(
    pokemon: Pick<DraftPokemon, 'id' | 'shiny'>,
  ): SpriteData | null {
    let spriteSet = this.settingsService.settingsData.spriteSet;
    if (!(spriteSet && spriteSet in SpriteSets)) spriteSet = this.DEFAULT;
    const pokemonData = getPokemonData(pokemon.id);
    if (!pokemonData) return null;
    let config = SpriteSets[spriteSet as SpriteSetKey];
    let props = pokemonData.sources[config.source];
    if (!props) {
      if (pokemonData.default && pokemonData.default) {
        config = SpriteSets[pokemonData.default];
        props = pokemonData.sources[config.source];
      }
    }
    if (!props) return null;
    const pathId = props.id ?? pokemon.id;
    const path = config.getPath(pathId, pokemon.shiny || false);

    const fallbackPath = config.fallback
      ? config.fallback(pathId, pokemon.shiny)
      : undefined;
    if (pokemon.id === 'crucibellemega')
      console.log({ pokemonData, config, props, path, fallbackPath });
    const classes = [...config.classes];
    const flip = !!(config.flip || props.flip);

    return { path, fallbackPath, classes, flip };
  }
}
