import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  getNameByPid,
  getPidByName,
  getSpriteProperties,
  SpriteProperties,
} from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';
import { SettingsService } from '../../pages/settings/settings.service';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  styleUrl: './sprite.component.scss',
  templateUrl: './sprite.component.html',
})
export class SpriteComponent {
  constructor(private settingService: SettingsService) {}
  @Input()
  set pokemon(value: Pokemon) {
    this.updateData(value);
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
    | null = null;

  @Input()
  set name(value: string) {
    let id = getPidByName(value);
    if (!id) return;
    this._pokemon = { id, name: value };
    this.updateData(this._pokemon);
  }

  get name() {
    return this._pokemon.name;
  }

  @Input() size?: string;

  @Input()
  set pid(value: string) {
    let name = getNameByPid(value);
    this._pokemon = { id: value, name };
    this.updateData(this._pokemon);
  }

  get pid() {
    return this._pokemon.id;
  }
  flip = false;
  @Input() flipped: string | boolean | null = null;
  @Input() disabled? = false;
  get pokemon(): Pokemon {
    return this._pokemon;
  }
  _pokemon!: Pokemon;
  path = '../../../../assets/icons/unknown.svg';
  _classes: string[] = [];
  set classes(value: string[]) {
    this._classes = value;
  }

  get classes() {
    let classes = [...this._classes];
    if (
      (this.flipped === null && this.flip) ||
      (this.flipped !== null && !this.flip)
    )
      classes.push('flip');
    if (this.disabled) classes.push('disabled');
    return classes;
  }

  updateData(pokemon: Pokemon) {
    this.classes = [];
    let props: SpriteProperties | undefined = undefined;
    this.flip = false;
    switch (this.settingService.settingsData.spriteSet) {
      case 'bw':
        props = getSpriteProperties(pokemon.id, 'ps');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = `https://play.pokemonshowdown.com/sprites/gen5${
          pokemon.shiny ? '-shiny' : ''
        }/${props.id}.png`;
        break;
      case 'afd':
        props = getSpriteProperties(pokemon.id, 'ps');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = `https://play.pokemonshowdown.com/sprites/afd${
          pokemon.shiny ? '-shiny' : ''
        }/${props.id}.png`;
        break;
      case 'sv':
        props = getSpriteProperties(pokemon.id, 'ps');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = props.path(props.id, pokemon.shiny);
        break;
      case 'ani':
        props = getSpriteProperties(pokemon.id, 'ps');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = `https://play.pokemonshowdown.com/sprites/ani${
          pokemon.shiny ? '-shiny' : ''
        }/${props.id}.gif`;
        break;
      case 'serebii':
        props = getSpriteProperties(pokemon.id, 'serebii');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = props.path(props.id, pokemon.shiny);
        this.classes = ['sprite-border'];
        break;
      case 'pmd':
        props = getSpriteProperties(pokemon.id, 'pmd');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = props.path(props.id, pokemon.shiny);
        this.flip = true;
        this.classes = ['rounded-xl', 'border', 'border-symbolColor-sub'];
        break;
      default:
        props = getSpriteProperties(pokemon.id, 'pd');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = props.path(props.id, pokemon.shiny);
        this.classes = ['sprite-border'];
        break;
    }
    if (props?.flip) {
      this.flip = !this.flip;
    }
  }

  fallback() {
    if (this.pokemon) {
      let props: SpriteProperties | undefined = undefined;
      switch (this.settingService.settingsData.spriteSet) {
        case 'sv':
        case 'ani':
          props = getSpriteProperties(this.pokemon.id, 'ps');
          if (props) {
            this.path = `https://play.pokemonshowdown.com/sprites/gen5${
              this.pokemon.shiny ? '-shiny' : ''
            }/${props.id}.png`;
            break;
          }
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        case 'pmd':
          props = getSpriteProperties(this.pokemon.id, 'pmd');
          if (props) {
            let base = props.id.split('/');
            base.pop();
            if (base.length !== 0) {
              this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base.join(
                '/',
              )}/Normal.png`;
            }
          }
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        default:
          this.path = '../../../../assets/icons/unknown.svg';
          break;
      }
    }
  }
}
