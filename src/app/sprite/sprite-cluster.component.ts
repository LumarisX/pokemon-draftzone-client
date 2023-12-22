import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BattlePokedex } from '../pokedex';
import { SpriteComponent } from './sprite.component';

@Component({
  selector: 'sprite-cluster',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  template: `
  <div class="relative mx-20">
    <sprite class="absolute opacity-100 mx-16 -scale-x-100" [pokemonId]="pokemonIds[1]"></sprite>
    <sprite class="absolute opacity-100 mx-8 -scale-x-100" [pokemonId]="pokemonIds[2]"></sprite>
    <sprite class="absolute" [pokemonId]="pokemonIds[0]"></sprite>
  </div>
  `
})
export class SpriteClusterComponent {

  @Input() pokemonIds!: (keyof typeof BattlePokedex)[];

}
