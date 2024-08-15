import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { SettingsService } from '../pages/settings/settings.service';
import { getSpriteProperties } from '../pokemon';
import { SpriteProperties } from '../pokedex';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full flex justify-center items-end ">
      <img
        class="h-full w-full -z-100 object-contain aspect-square	"
        *ngIf="pokemon.id"
        [ngClass]="this.classes"
        title="{{ pokemon.name }}"
        src="{{ path }}"
        onerror="this.src='../../../../assets/icons/unknown.svg'"
        (error)="fallback()"
      />
    </div>
  `,
})
export class SpriteComponent {
  constructor(private settingService: SettingsService) {}
  @Input()
  set pokemon(value: Pokemon) {
    this.updateData(value);
    this._pokemon = value;
  }
  flip = false;
  @Input() flipped? = false;
  @Input() disabled? = false;
  get pokemon() {
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
    if ((!this.flipped && this.flip) || (this.flipped && !this.flip))
      classes.push('-scale-x-100');
    if (this.disabled) classes.push('opacity-40');
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
        this.path = `https://play.pokemonshowdown.com/sprites/dex${
          pokemon.shiny ? '-shiny' : ''
        }/${props.id}.png`;
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
        this.path = `https://serebii.net/${
          pokemon.shiny ? 'Shiny/SV' : 'scarletviolet/pokemon'
        }/new/${props.id}.png`;
        this.classes = ['sprite-border'];
        break;
      case 'pmd':
        props = getSpriteProperties(pokemon.id, 'pmd');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        if (pokemon.shiny) {
          let splitBase = props.id.split('/');
          if (!splitBase[1]) {
            splitBase[1] = '0000';
          }
          splitBase.splice(2, 1, '0001');
          this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${splitBase.join(
            '/'
          )}/Normal.png`;
        } else {
          this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${props.id}/Normal.png`;
        }
        this.flip = true;
        this.classes = ['rounded-xl', 'border', 'border-symbolColor-sub'];
        break;
      default:
        props = getSpriteProperties(pokemon.id, 'pd');
        if (!props) {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        this.path = `https://img.pokemondb.net/sprites/home/${
          pokemon.shiny ? 'shiny' : 'normal'
        }/${props.id}.png`;
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
                '/'
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
