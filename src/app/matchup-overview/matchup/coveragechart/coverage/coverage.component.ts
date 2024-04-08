import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, effect } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite.component';
import { CoverageChart, TypeChart, Types } from '../../../matchup-interface';
import { Pokemon } from '../../../../interfaces/draft';

@Component({
  selector: 'coverage',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coverage.component.html',
})
export class CoverageComponent implements OnInit {
  @Input() pokemon!: CoverageChart;
  @Input() typechart!: TypeChart;
  constructor() {}

  ngOnInit(): void {
    this.calcCoverage();
  }

  calcCoverage(): {
    team: {
      pokemon: Pokemon & {
        weak: Types;
        disabled?: Boolean | undefined;
      };
      max: number;
    }[];
    se: number;
    e: number;
    ne: number;
  } {
    const selectedMoves = [
      ...this.pokemon.coverage.physical
        .concat(this.pokemon.coverage.special)
        .filter((move) => move.recommended),
    ];

    let out = {
      team: this.typechart.team
        .map((pokemon) => ({
          pokemon,
          max: Math.max(
            ...selectedMoves.map((move) => pokemon.weak[move.type])
          ),
        }))
        .sort((x, y) => y.max - x.max),
      se: 0,
      e: 0,
      ne: 0,
    };
    console.log(this.pokemon.pid);
    out.team.forEach((pokemon) => {
      if (pokemon.max > 1) {
        out.se++;
      } else if (pokemon.max < 1) {
        out.ne++;
      } else {
        out.e++;
      }
    });

    return out;
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
