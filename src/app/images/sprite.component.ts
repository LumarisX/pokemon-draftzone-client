import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { getSpriteName } from '../pokemon';
import { SettingsService } from '../pages/settings/settings.service';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full w-full flex justify-center items-end">
      <img
        class="max-h-full max-w-full -z-100 object-contain aspect-square	"
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
    if (this.flipped) this._classes.push('-scale-x-100');
    if (this.disabled) this._classes.push('opacity-40');
    return this._classes;
  }
  @Input() flipped? = false;
  @Input() disabled? = false;

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
        this.classes.push('sprite-border');
        break;
      default:
        this.path = `https://img.pokemondb.net/sprites/home/${
          pokemon.shiny ? 'shiny' : 'normal'
        }/${getSpriteName(pokemon.pid, 'pd')}.png`;
        this.classes.push('sprite-border');
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
        default:
          this.path = '../../../../assets/icons/unknown.svg';
          break;
      }
    }
  }
}
