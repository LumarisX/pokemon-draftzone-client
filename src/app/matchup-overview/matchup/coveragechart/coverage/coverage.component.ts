import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../../sprite/sprite.component';
import { CoverageChart } from '../../../matchup-interface';

@Component({
  selector: 'coverage',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coverage.component.html',
})
export class CoverageComponent {
  @Input() pokemon!: CoverageChart;

  constructor() {}

  calcCoverage() {
    let selectedMoves = [];
    for (let move of this.pokemon.coverage.physical) {
      if (move.recommended) {
        selectedMoves.push(move.type);
      }
    }
    for (let move of this.pokemon.coverage.special) {
      if (move.recommended) {
        selectedMoves.push(move.type);
      }
    }
    return selectedMoves;
  }
}
