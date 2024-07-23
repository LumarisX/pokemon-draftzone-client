import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { SettingsService } from '../pages/settings/settings.service';
import { getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full flex justify-center items-end ">
      <img
        class="h-full w-full -z-100 object-contain aspect-square	"
        *ngIf="pokemon.pid"
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
  flip = true;
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
    switch (this.settingService.settingsData.spriteSet) {
      case 'bw':
        this.path = `https://play.pokemonshowdown.com/sprites/gen5${
          pokemon.shiny ? '-shiny' : ''
        }/${getSpriteName(pokemon.pid, 'ps')}.png`;
        break;
      case 'afd':
        this.path = `https://play.pokemonshowdown.com/sprites/afd${
          pokemon.shiny ? '-shiny' : ''
        }/${getSpriteName(pokemon.pid, 'ps')}.png`;
        break;
      case 'sv':
        this.path = `https://play.pokemonshowdown.com/sprites/dex${
          pokemon.shiny ? '-shiny' : ''
        }/${getSpriteName(pokemon.pid, 'ps')}.png`;
        break;
      case 'ani':
        this.path = `https://play.pokemonshowdown.com/sprites/ani${
          pokemon.shiny ? '-shiny' : ''
        }/${getSpriteName(pokemon.pid, 'ps')}.gif`;
        break;
      case 'serebii':
        this.path = `https://serebii.net/${
          pokemon.shiny ? 'Shiny/SV' : 'scarletviolet/pokemon'
        }/new/${getSpriteName(pokemon.pid, 'serebii')}.png`;
        this.classes = ['sprite-border'];
        break;
      case 'pmd':
        let base = getSpriteName(pokemon.pid, 'pmd');
        if (base === '') {
          this.path = '../../../../assets/icons/unknown.svg';
          break;
        }
        if (pokemon.shiny) {
          let splitBase = base.split('/');
          if (!splitBase[1]) {
            splitBase[1] = '0000';
          }
          splitBase.splice(2, 1, '0001');
          this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${splitBase.join(
            '/'
          )}/Normal.png`;
        } else {
          this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base}/Normal.png`;
        }
        this.flip = true;
        this.classes = ['rounded-xl', 'border', 'border-symbolColor-sub'];
        break;
      default:
        this.path = `https://img.pokemondb.net/sprites/home/${
          pokemon.shiny ? 'shiny' : 'normal'
        }/${getSpriteName(pokemon.pid, 'pd')}.png`;
        this.classes = ['sprite-border'];
        break;
    }
  }

  fallback() {
    if (this.pokemon) {
      switch (this.settingService.settingsData.spriteSet) {
        case 'sv':
        case 'ani':
          this.path = `https://play.pokemonshowdown.com/sprites/gen5${
            this.pokemon.shiny ? '-shiny' : ''
          }/${getSpriteName(this.pokemon.pid, 'ps')}.png`;
          break;
        case 'pmd':
          let base = getSpriteName(this.pokemon.pid, 'pmd').split('/');
          base.pop();
          if (base.length === 0) {
            this.path = '../../../../assets/icons/unknown.svg';
            break;
          }
          this.path = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base.join(
            '/'
          )}/Normal.png`;
          break;
        default:
          this.path = '../../../../assets/icons/unknown.svg';
          break;
      }
    }
  }
}
