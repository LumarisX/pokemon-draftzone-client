import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="h-full w-full -z-100 object-contain"
      *ngIf="pokemon.pid"
      [ngClass]="this.classes"
      title="{{ pokemon.name }}"
      src="{{ path }}"
      onerror="this.src='../../../../assets/icons/unknown.svg'"
    />
  `,
})
export class SpriteComponent {
  @Input()
  set pokemon(value: Pokemon) {
    this.updateData(value);
    this._pokemon = value;
  }

  get pokemon() {
    return this._pokemon;
  }

  source: 'home' | 'serebii' | 'icon' | 'bw' | 'sv' | 'ani' | '?' = 'home';
  _pokemon!: Pokemon;
  path = '../../../../assets/icons/unknown.svg';
  _classes: string[] = [];
  set classes(value: string[]) {
    this._classes = value;
  }
  get classes() {
    if (this.flipped) this._classes.push('-scale-x-100');
    return this._classes;
  }
  @Input() flipped? = false;

  updateData(pokemon: Pokemon) {
    switch (this.source) {
      case 'home':
        this.path = `https://img.pokemondb.net/sprites/home/${
          pokemon.shiny ? 'shiny' : 'normal'
        }/${getSpriteName(pokemon.pid, 'pd')}.png`;
        this.classes.push('sprite-border');
        break;
      case 'bw':
        this.path = `https://play.pokemonshowdown.com/sprites/gen5${
          pokemon.shiny ? '-shiny' : ''
        }/${getSpriteName(pokemon.pid, 'ps')}.png`;
        break;
      case 'icon':
        this.path = `https://img.pokemondb.net/sprites/scarlet-violet/icon/${getSpriteName(
          pokemon.pid,
          'pd'
        )}.png`;
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
        break;
    }
  }
}
