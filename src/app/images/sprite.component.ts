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
      class="h-full w-full"
      *ngIf="pokemon.pid"
      [ngClass]="isFlipped()"
      title="{{ pokemon.name }}"
      src="{{ getPath() }}"
      onerror="this.src='../../assets/icons/unknown.svg'"
    />
  `,
})
export class SpriteComponent {
  @Input() pokemon!: Pokemon;
  @Input() flipped? = false;
  source: 'home' | 'serebii' | 'ps' = 'ps';

  getPath() {
    if (this.pokemon) {
      if (this.source == 'home') {
        if (this.pokemon.shiny) {
          return (
            'https://img.pokemondb.net/sprites/home/shiny/' +
            getSpriteName(this.pokemon.pid, 'pd') +
            '.png'
          );
        } else {
          return (
            'https://img.pokemondb.net/sprites/home/normal/' +
            getSpriteName(this.pokemon.pid, 'pd') +
            '.png'
          );
        }
      } else if (this.source == 'ps') {
        if (this.pokemon.shiny) {
          return (
            'https://play.pokemonshowdown.com/sprites/gen5-shiny/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.png'
          );
        } else {
          return (
            'https://play.pokemonshowdown.com/sprites/gen5/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.png'
          );
        }
      } else if (this.source == 'serebii') {
        if (this.pokemon.shiny) {
          return (
            'https://serebii.net/Shiny/SV/new/' +
            getSpriteName(this.pokemon.pid, this.source) +
            '.png'
          );
        } else {
          return (
            'https://serebii.net/scarletviolet/pokemon/new/' +
            getSpriteName(this.pokemon.pid, this.source) +
            '.png'
          );
        }
      }
    }
    return '../../assets/icons/unknown.svg';
  }

  isFlipped() {
    if (this.flipped) return '-scale-x-100';
    return;
  }
}
