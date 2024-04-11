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
      class="h-full w-full -z-100"
      *ngIf="pokemon.pid"
      [ngClass]="isFlipped()"
      title="{{ pokemon.name }}"
      src="{{ getPath('bw') }}"
      onerror="this.src='../../../../assets/icons/unknown.svg'"
    />
  `,
})
export class SpriteComponent {
  @Input() pokemon!: Pokemon;
  @Input() flipped? = false;

  getPath(source: 'home' | 'serebii' | 'icon' | 'bw' | 'sv' | 'ani' | '?') {
    if (this.pokemon) {
      if (source == 'home') {
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
      } else if (source == 'bw') {
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
      } else if (source == 'icon') {
        return (
          'https://img.pokemondb.net/sprites/scarlet-violet/icon/' +
          getSpriteName(this.pokemon.pid, 'pd') +
          '.png'
        );
      } else if (source == 'sv') {
        if (this.pokemon.shiny) {
          return (
            'https://play.pokemonshowdown.com/sprites/dex-shiny/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.png'
          );
        } else {
          return (
            'https://play.pokemonshowdown.com/sprites/dex/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.png'
          );
        }
      } else if (source == 'ani') {
        if (this.pokemon.shiny) {
          return (
            'https://play.pokemonshowdown.com/sprites/ani-shiny/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.gif'
          );
        } else {
          return (
            'https://play.pokemonshowdown.com/sprites/ani/' +
            getSpriteName(this.pokemon.pid, 'ps') +
            '.gif'
          );
        }
      } else if (source == 'serebii') {
        if (this.pokemon.shiny) {
          return (
            'https://serebii.net/Shiny/SV/new/' +
            getSpriteName(this.pokemon.pid, source) +
            '.png'
          );
        } else {
          return (
            'https://serebii.net/scarletviolet/pokemon/new/' +
            getSpriteName(this.pokemon.pid, source) +
            '.png'
          );
        }
      }
    }
    return '../../assets/icons/unknown.svg';
  }

  isFlipped() {
    if (this.flipped) return '-scale-x-100';
    return '';
  }
}
