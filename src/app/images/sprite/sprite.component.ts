import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  getNameByPid,
  getPidByName,
  getSpriteProperties,
  SpriteProperties,
} from '../../data/namedex';
import { DraftOptions, Pokemon } from '../../interfaces/pokemon';
import { SettingsService } from '../../pages/settings/settings.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type SpritePokemon = Pokemon<DraftOptions & { loaded?: boolean }>;

type SpriteSetConfigs = {
  getPath: (props: SpriteProperties, shiny: boolean) => string;
  classes: string[];
  flip?: boolean;
  spriteSource: 'ps' | 'serebii' | 'pmd' | 'pd';
};

@Component({
  selector: 'pdz-sprite',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatProgressSpinnerModule],
  styleUrl: './sprite.component.scss',
  templateUrl: './sprite.component.html',
})
export class SpriteComponent implements OnChanges {
  constructor(private settingService: SettingsService) {}
  @Input()
  set pokemon(value: SpritePokemon) {
    this._pokemon = value;
  }

  @Input()
  tooltipPosition:
    | 'before'
    | 'after'
    | 'above'
    | 'below'
    | 'left'
    | 'right'
    | null = 'above';

  @Input()
  set name(value: string) {
    let id = getPidByName(value);
    if (!id) return;
    this._pokemon = { id, name: value };
  }

  get name() {
    return this._pokemon.name;
  }

  @Input() size?: string;

  @Input()
  set pid(value: string) {
    let name = getNameByPid(value);
    this._pokemon = { id: value, name };
  }

  get pid() {
    return this._pokemon.id;
  }
  flip = false;
  @Input() flipped: string | boolean | null = null;
  @Input() disabled? = false;

  @Output() loaded = new EventEmitter<void>();

  get pokemon(): SpritePokemon {
    return this._pokemon;
  }
  _pokemon!: SpritePokemon;
  readonly UNKNOWN_SPRITE_PATH = '../../../../assets/icons/unknown.svg';
  path = this.UNKNOWN_SPRITE_PATH;
  _classes: string[] = [];
  set classes(value: string[]) {
    this._classes = value;
  }

  get classes(): string[] {
    const classes = [...this._classes];
    const isUnknownSprite = this.path === this.UNKNOWN_SPRITE_PATH;
    if (!isUnknownSprite) {
      const shouldFlip =
        (this.flipped === null && this.flip) ||
        (this.flipped !== null && !this.flip);

      if (shouldFlip) {
        classes.push('flip');
      }
    }
    if (this.disabled) {
      classes.push('disabled');
    }
    return classes;
  }

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokemon'] && changes['pokemon'].currentValue) {
      this.updateData(changes['pokemon'].currentValue);
    } else if (changes['name'] && changes['name'].currentValue) {
      const id = getPidByName(changes['name'].currentValue);
      if (id) {
        this._pokemon = { id, name: changes['name'].currentValue };
        this.updateData(this._pokemon);
      }
    } else if (changes['pid'] && changes['pid'].currentValue) {
      const name = getNameByPid(changes['pid'].currentValue);
      if (name) {
        this._pokemon = { id: changes['pid'].currentValue, name };
        this.updateData(this._pokemon);
      }
    }
  }

  updateData(pokemon: SpritePokemon) {
    this.classes = [];
    this.flip = false;
    const spriteSetName = this.settingService.settingsData.spriteSet;
    const config = spriteSetName
      ? this.spriteSetMap.get(spriteSetName) || this.spriteSetMap.get('default')
      : this.spriteSetMap.get('default');

    if (!config) {
      this.path = this.UNKNOWN_SPRITE_PATH;
      return;
    }

    const props = getSpriteProperties(pokemon.id, config.spriteSource);

    if (!props) {
      this.path = this.UNKNOWN_SPRITE_PATH;
      return;
    }

    this.path = config.getPath(props, pokemon.shiny || false);
    this.classes = [...config.classes];
    if (config.flip || props.flip) {
      this.flip = !this.flip;
    }
  }

  fallback(): void {
    if (this.path !== this.UNKNOWN_SPRITE_PATH) {
      let potentialFallbackPath: string | undefined;
      switch (this.settingService.settingsData.spriteSet) {
        case 'sv':
        case 'ani':
          const psProps = getSpriteProperties(this.pokemon.id, 'ps');
          if (psProps) {
            potentialFallbackPath = `https://play.pokemonshowdown.com/sprites/gen5${
              this.pokemon.shiny ? '-shiny' : ''
            }/${psProps.id}.png`;
          }
          break;
        case 'pmd':
          const pmdProps = getSpriteProperties(this.pokemon.id, 'pmd');
          if (pmdProps) {
            const base = pmdProps.id.split('/');
            base.pop();
            if (base.length !== 0) {
              potentialFallbackPath = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base.join(
                '/',
              )}/Normal.png`;
            }
          }
          break;
      }
      if (potentialFallbackPath) {
        this.path = potentialFallbackPath;
      } else {
        this.path = this.UNKNOWN_SPRITE_PATH;
      }
    } else {
      console.warn(
        `Sprite for ${this.pokemon?.name || 'unknown'} already failed, showing fallback.`,
      );
    }
  }

  onSpriteLoaded() {
    this.pokemon.loaded = true;
    this.loaded.emit();
  }
}
