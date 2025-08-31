import { Injectable, inject } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { getSpriteProperties, SpriteProperties } from '../data/namedex';
import { SettingsService } from '../pages/settings/settings.service';

type SpriteSetConfigs = {
  getPath: (props: SpriteProperties, shiny: boolean) => string;
  classes: string[];
  flip?: boolean;
  spriteSource: 'ps' | 'serebii' | 'pmd' | 'pd';
};

export interface SpriteData {
  path: string;
  fallbackPath?: string;
  classes: string[];
  flip: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SpriteService {
  private settingsService = inject(SettingsService);

  readonly UNKNOWN_SPRITE_PATH = '../../../../assets/icons/unknown.svg';

  private spriteSetMap: Map<string, SpriteSetConfigs> = new Map([
    [
      'bw',
      {
        getPath: (props, shiny) =>
          `https://play.pokemonshowdown.com/sprites/gen5${shiny ? '-shiny' : ''}/${props.id}.png`,
        classes: [],
        spriteSource: 'ps',
      },
    ],
    [
      'afd',
      {
        getPath: (props, shiny) =>
          `https://play.pokemonshowdown.com/sprites/afd${shiny ? '-shiny' : ''}/${props.id}.png`,
        classes: [],
        spriteSource: 'ps',
      },
    ],
    [
      'sv',
      {
        getPath: (props, shiny) => props.path(props.id, shiny),
        classes: [],
        spriteSource: 'ps',
      },
    ],
    [
      'ani',
      {
        getPath: (props, shiny) =>
          `https://play.pokemonshowdown.com/sprites/ani${shiny ? '-shiny' : ''}/${props.id}.gif`,
        classes: [],
        spriteSource: 'ps',
      },
    ],
    [
      'serebii',
      {
        getPath: (props, shiny) => props.path(props.id, shiny),
        classes: ['sprite-border'],
        spriteSource: 'serebii',
      },
    ],
    [
      'pmd',
      {
        getPath: (props, shiny) => props.path(props.id, shiny),
        classes: ['rounded-xl', 'border', 'border-symbolColor-sub'],
        flip: true,
        spriteSource: 'pmd',
      },
    ],
    [
      'default',
      {
        getPath: (props, shiny) => props.path(props.id, shiny),
        classes: ['sprite-border'],
        spriteSource: 'pd',
      },
    ],
  ]);

  /**
   * Gets all the necessary data to display a Pokemon sprite.
   * @param pokemon The Pokemon object, requires at least an 'id'.
   * @returns An object containing the primary path, a potential fallback path, CSS classes, and flip status.
   */
  public getSpriteData(pokemon: Pick<Pokemon, 'id' | 'shiny'>): SpriteData {
    const spriteSet = this.settingsService.settingsData.spriteSet;
    const config =
      (spriteSet && this.spriteSetMap.get(spriteSet)) ||
      this.spriteSetMap.get('default');

    if (!config || !pokemon.id) {
      return {
        path: this.UNKNOWN_SPRITE_PATH,
        classes: [],
        flip: false,
      };
    }

    const props = getSpriteProperties(pokemon.id, config.spriteSource);

    if (!props) {
      return {
        path: this.UNKNOWN_SPRITE_PATH,
        classes: [],
        flip: false,
      };
    }

    const path = config.getPath(props, pokemon.shiny || false);
    const fallbackPath = this.getFallbackPath(pokemon, spriteSet ?? 'default');
    const classes = [...config.classes];
    const flip = !!(config.flip || props.flip);

    return { path, fallbackPath, classes, flip };
  }

  private getFallbackPath(
    pokemon: Pick<Pokemon, 'id' | 'shiny'>,
    spriteSet: string,
  ): string | undefined {
    switch (spriteSet) {
      case 'sv':
      case 'ani':
        const psProps = getSpriteProperties(pokemon.id, 'ps');
        if (psProps) {
          return `https://play.pokemonshowdown.com/sprites/gen5${
            pokemon.shiny ? '-shiny' : ''
          }/${psProps.id}.png`;
        }
        return undefined;

      case 'pmd':
        const pmdProps = getSpriteProperties(pokemon.id, 'pmd');
        if (pmdProps) {
          const base = pmdProps.id.split('/');
          base.pop();
          if (base.length > 0) {
            return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base.join(
              '/',
            )}/Normal.png`;
          }
        }
        return undefined;

      default:
        return undefined;
    }
  }
}
