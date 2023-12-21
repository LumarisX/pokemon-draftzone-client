import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BattlePokedex } from '../pokedex';
import { getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
  <abbr title={{pokemonId}}><img src={{getPath()}} onerror="this.src='https://play.pokemonshowdown.com/sprites/gen5/0.png';">
  `
})
export class SpriteComponent {

  @Input() pokemonId!: keyof typeof BattlePokedex;

  getPath() {
    return "https://play.pokemonshowdown.com/sprites/gen5/" + getSpriteName(this.pokemonId) + ".png"
  }

}
