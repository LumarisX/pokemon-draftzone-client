import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { CoverageChart, TypeChart, Types } from '../../../matchup-interface';

@Component({
  selector: 'coverage',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coverage.component.html',
})
export class CoverageComponent implements OnInit {
  @Input() pokemon!: CoverageChart;
  @Input() typechart!: TypeChart;
  coverage: {
    pokemon: Pokemon & {
      weak: Types;
      disabled?: Boolean | undefined;
    };
    max: number;
  }[] = [];
  se: number = 0;
  e: number = 0;
  ne: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.updateCoverage();
  }

  updateCoverage() {
    const selectedMoves = [
      ...this.pokemon.coverage.physical
        .concat(this.pokemon.coverage.special)
        .filter((move) => move.recommended),
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
    this.se = Math.round((this.se / this.coverage.length) * 100);
    this.e = Math.round((this.e / this.coverage.length) * 100);
    this.ne = Math.round((this.ne / this.coverage.length) * 100);
  }

  seColor(max: number) {
    if (max > 1) {
      return 'bg-emerald-300 border border-emerald-400';
    } else if (max == 1) {
      return 'bg-slate-300 border border-slate-400';
    } else {
      return 'bg-rose-300 border border-rose-400';
    }
  }
}
