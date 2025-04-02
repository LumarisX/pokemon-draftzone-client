import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SpriteComponent } from '../../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../../interfaces/draft';
import { Coverage, CoverageChart, TypeChart } from '../../../matchup-interface';
import { EffectivenessChartComponent } from './effectiveness-chart/effectiveness-chart.component';
import { ExtendedType } from '../../../../../data';
import { typeColor } from '../../../../../util/styling';

@Component({
  selector: 'coverage',
  standalone: true,
  templateUrl: './coverage.component.html',
  styleUrl: './coverage.component.scss',
  imports: [CommonModule, SpriteComponent, EffectivenessChartComponent],
})
export class CoverageComponent implements OnInit {
  @Input() typechart!: TypeChart;
  coverage: {
    pokemon: Pokemon & {
      weak: [
        {
          [key in ExtendedType]: number;
        },
        {
          [key in ExtendedType]: number;
        },
      ];
      disabled?: Boolean | undefined;
    };
    max: number;
  }[] = [];
  se: number = 0;
  e: number = 0;
  ne: number = 0;

  @Input()
  pokemon!: CoverageChart;

  constructor() {}

  ngOnInit(): void {
    this.resetRecommended();
  }

  typeColor = typeColor;

  updateCoverage() {
    const selectedMoves = [
      ...this.pokemon.coverage.physical
        .concat(this.pokemon.coverage.special)
        .filter((move) => move.selected),
    ];
    this.coverage = this.typechart.team
      .map((pokemon) => ({
        pokemon,
        max: Math.max(
          ...selectedMoves.map((move) => pokemon.weak[1][move.type]),
        ),
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
