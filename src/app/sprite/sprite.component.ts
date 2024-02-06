import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PokemonId, getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="h-full w-full"
      [ngClass]="isFlipped()"
      title="{{ pokemonId }}"
      src="{{ getPath() }}"
      onerror="this.src='https://play.pokemonshowdown.com/sprites/gen5/0.png';"
    />
  `,
})
export class SpriteComponent {
  @Input() pokemonId!: PokemonId | '';
  @Input() flipped? = false;

  getPath() {
    return (
      'https://play.pokemonshowdown.com/sprites/gen5/' +
      getSpriteName(this.pokemonId) +
      '.png'
    );
  }

  isFlipped() {
    if (this.flipped) return '-scale-x-100';
    return;
  }
}
