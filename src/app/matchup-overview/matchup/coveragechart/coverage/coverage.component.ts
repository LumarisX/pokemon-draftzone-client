import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { CoverageChart, TypeChart } from '../../../matchup-interface';
import { EffectivenessChartComponent } from './effectiveness-chart/effectiveness-chart.component';
import { ExtendedType } from '../../../../data';

@Component({
  selector: 'coverage',
  standalone: true,
  templateUrl: './coverage.component.html',
  imports: [CommonModule, SpriteComponent, EffectivenessChartComponent],
})
export class CoverageComponent implements OnInit {
  @Input() pokemon!: CoverageChart;
  @Input() typechart!: TypeChart;
  coverage: {
    pokemon: Pokemon & {
      weak: {
        [key in ExtendedType]: number;
      };
      disabled?: Boolean | undefined;
    };
    max: number;
  }[] = [];
  se: number = 0;
  e: number = 0;
  ne: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.resetRecommended();
  }

  updateCoverage() {
    const selectedMoves = [
      ...this.pokemon.coverage.physical
        .concat(this.pokemon.coverage.special)
        .filter((move) => move.selected),
    ];

    this.coverage = this.typechart.team
      .map((pokemon) => ({
        pokemon,
        max: Math.max(...selectedMoves.map((move) => pokemon.weak[move.type])),
      }))
      .sort((x, y) => y.max - x.max);
    this.se = 0;
    this.e = 0;
    this.ne = 0;
    this.coverage.forEach((pokemon) => {
      if (pokemon.max > 1) {
        this.se++;
      } else if (pokemon.max < 1) {
        this.ne++;
      } else {
        this.e++;
      }
    });
    this.se = this.se / this.coverage.length;
    this.e = this.e / this.coverage.length;
    this.ne = this.ne / this.coverage.length;
  }

  seColor(max: number) {
    if (max > 1) {
      return 'bg-scale-positive-2 border border-scale-positive-3';
    } else if (max == 1) {
      return 'bg-scale-neutral border border-menu-400';
    } else {
      return 'bg-scale-negative-2 border border-scale-negative-3';
    }
  }

  resetRecommended() {
    this.pokemon.coverage.physical.forEach((move) => {
      move.selected = move.recommended;
    });
    this.pokemon.coverage.special.forEach((move) => {
      move.selected = move.recommended;
    });
    this.updateCoverage();
  }
}
