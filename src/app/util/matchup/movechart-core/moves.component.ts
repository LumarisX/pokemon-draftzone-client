import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MoveChart } from '../../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PokemonTypeComponent } from '../../../components/pokemon-type/pokemon-type.component';

@Component({
  selector: 'pdz-moves-core',
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.scss',
  imports: [CommonModule, SpriteComponent, PokemonTypeComponent],
})
export class MoveCoreComponent {
  @Input()
  movechart: MoveChart = [];
}
