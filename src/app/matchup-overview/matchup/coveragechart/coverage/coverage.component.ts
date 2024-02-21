import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../../sprite/sprite.component';
import { CoverageChart, TypeChart } from '../../../matchup-interface';

@Component({
  selector: 'coverage',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coverage.component.html',
})
export class CoverageComponent {
  @Input() pokemon!: CoverageChart;
  @Input() typechart!: TypeChart;

  constructor() {}

  calcCoverage() {
    let selectedMoves = [];
    for (let move of this.pokemon.coverage.physical) {
      if (move.recommended) {
        selectedMoves.push(move);
      }
    }
    for (let move of this.pokemon.coverage.special) {
      if (move.recommended) {
        selectedMoves.push(move);
      }
    }
    let superEffective = [];
    let effective = [];
    let notVeryEffective = [];
    for (let pokemon of this.typechart.team) {
      let max = 0;
      for (let move of selectedMoves) {
        if (max < pokemon.weak[move.type]) {
          max = pokemon.weak[move.type];
        }
      }
      if (max > 1) {
        superEffective.push({ pid: pokemon.pid, name: pokemon.name });
      } else if (max == 1) {
        effective.push({ pid: pokemon.pid, name: pokemon.name });
      } else {
        notVeryEffective.push({ pid: pokemon.pid, name: pokemon.name });
      }
    }
    return { se: superEffective, e: effective, ne: notVeryEffective };
  }
}
