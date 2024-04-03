import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';
import { getSpriteName } from '../pokemon';

@Component({
  selector: 'tera',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="h-full w-full"
      *ngIf="pokemon.pid"
      [ngClass]="isFlipped()"
      title="{{ pokemon.name }}"
      src="{{ getPath() }}"
      onerror="this.src='../../assets/icons/unknown.svg'"
    />
  `,
})
export class TeraComponent {
  @Input() pokemon!: Pokemon;
  @Input() flipped? = false;

  getPath() {
    if (!this.pokemon) {
      return '../../assets/icons/unknown.svg';
    }
    if (this.pokemon.shiny) {
      return (
        'https://play.pokemonshowdown.com/sprites/gen5-shiny/' +
        getSpriteName(this.pokemon.pid) +
        '.png'
      );
    } else {
      return (
        'https://play.pokemonshowdown.com/sprites/gen5/' +
        getSpriteName(this.pokemon.pid) +
        '.png'
      );
    }
  }

  isFlipped() {
    if (this.flipped) return '-scale-x-100';
    return;
  }
}
