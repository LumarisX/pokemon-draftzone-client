import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../pokemon';

@Component({
  selector: 'sprite',
  standalone: true,
  imports: [CommonModule],
  template: `
  <img src={{getPath()}}>
  `,
  styleUrl: './sprite.component.css'
})
export class SpriteComponent {
  
  @Input() target!: Pokemon; 

  getPath() {
    return "https://play.pokemonshowdown.com/sprites/gen5/"+this.target.getSpriteName()+".png"
  }

}
