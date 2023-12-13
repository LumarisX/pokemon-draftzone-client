import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon, getSpriteName } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
  <abbr title={{pokemon.pid}}><img src={{getPath()}} onerror="this.src='https://play.pokemonshowdown.com/sprites/gen5/0.png';">
  `
})
export class SpriteComponent {
  
  @Input() pokemon!: Pokemon; 



  getPath() {
    return "https://play.pokemonshowdown.com/sprites/gen5/"+getSpriteName(this.pokemon)+".png"
  }

}
