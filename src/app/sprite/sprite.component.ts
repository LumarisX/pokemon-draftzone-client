import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BattlePokedex } from '../pokedex';
import { getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
  <abbr title={{pokemonId}}><img [ngClass]="isFlipped()" src={{getPath()}} onerror="this.src='https://play.pokemonshowdown.com/sprites/gen5/0.png';"></abbr>
  `
})
export class SpriteComponent {

  @Input() pokemonId!: keyof typeof BattlePokedex;
  @Input() flipped? = false;

  getPath() {
    return "https://play.pokemonshowdown.com/sprites/gen5/" + getSpriteName(this.pokemonId) + ".png"
  }

  isFlipped(){
    if(this.flipped)
      return "-scale-x-100"
    return
  }

}
