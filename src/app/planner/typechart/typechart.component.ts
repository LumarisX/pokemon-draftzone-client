import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { ExtendedType, Type, TYPES } from '../../data';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';
import { CheckSVG } from '../../images/svg-components/score.component copy';
import { CircleSVG } from '../../images/svg-components/circle.component';

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent, CheckSVG, CircleSVG],
})
export class TypechartComponent implements OnChanges {
  @Input() typechart!: TypeChart;
  @Input() recommended?: {
    all: {
      pokemon: Pokemon[];
      types: Type[][];
    };
    unique: {
      pokemon: Pokemon[];
      types: Type[][];
    };
  };
  types = TYPES;
  counts: number[] = [];
  weaknesses: number[] = [];
  resistances: number[] = [];
  difference: number[] = [];
  differential: number[] = [];
  uniqueSelected: boolean = true;

  constructor() {}

  ngOnChanges(): void {
    this.summerize();
  }

  typeColor(weak: number, disbaled: Boolean): string {
    if (disbaled) return 'text-transparent border-menu-200';
    if (weak > 4) return 'bg-scale-negative-5 border-scale-negative-6';
    if (weak > 2) return 'bg-scale-negative-4  border-scale-negative-5';
    if (weak > 1) return 'bg-scale-negative-3  border-scale-negative-4';
    if (weak < 0.25) return 'bg-scale-positive-5  border-scale-positive-6';
    if (weak < 0.5) return 'bg-scale-positive-4  border-scale-positive-5';
    if (weak < 1) return 'bg-scale-positive-3  border-scale-positive-4';
    return 'text-transparent border-menu-200';
  }

  weakColor(weak: number): string {
    if (weak > 5) return 'bg-scale-negative-5 border-scale-negative-6';
    if (weak > 4) return 'bg-scale-negative-4  border-scale-negative-5';
    if (weak > 3) return 'bg-scale-negative-3  border-scale-negative-4';
    if (weak < 1) return 'bg-scale-positive-5  border-scale-positive-6';
    if (weak < 2) return 'bg-scale-positive-4  border-scale-positive-5';
    if (weak < 3) return 'bg-scale-positive-3 border-scale-positive-4';
    return 'border-menu-400';
  }

  resistColor(weak: number): string {
    if (weak > 4) return 'bg-scale-positive-5 border-scale-positive-6';
    if (weak > 3) return 'bg-scale-positive-4 border-scale-positive-5';
    if (weak > 2) return 'bg-scale-positive-3 border-scale-positive-4';
    if (weak < 1) return 'bg-scale-negative-4 border-scale-negative-5';
    if (weak < 2) return 'bg-scale-negative-3 border-scale-negative-4';
    return 'border-menu-400';
  }

  countColor(count: number): string {
    if (count > 3) return 'bg-scale-negative-5 border-scale-negative-6';
    if (count > 2) return 'bg-scale-negative-4  border-scale-negative-5';
    if (count > 1) return 'border-menu-400';
    if (count > 0) return 'bg-scale-positive-4 border-scale-positive-5';
    return 'border-menu-400';
  }

  diffColor(weak: number): string {
    if (weak > 3) return 'bg-scale-positive-6 border-scale-positive-7';
    if (weak > 2) return 'bg-scale-positive-5 border-scale-positive-6';
    if (weak > 1) return 'bg-scale-positive-4 border-scale-positive-5';
    if (weak > 0) return 'bg-scale-positive-3 border-scale-positive-4';
    if (weak < -2) return 'bg-scale-negative-5 border-scale-negative-6';
    if (weak < -1) return 'bg-scale-negative-4 border-scale-negative-5';
    if (weak < 0) return 'bg-scale-negative-3 border-scale-negative-4';
    return 'border-menu-400';
  }

  toggleVisible(
    pokemon: Pokemon & {
      weak: { [key in ExtendedType]: number };
      disabled?: Boolean;
    },
  ) {
    pokemon.disabled = !pokemon.disabled;
    this.summerize();
  }

  summerize() {
    this.weaknesses = new Array(this.types.length).fill(0);
    this.resistances = new Array(this.types.length).fill(0);
    this.difference = new Array(this.types.length).fill(0);
    this.differential = new Array(this.types.length).fill(0);
    this.counts = new Array(this.types.length).fill(0);
    for (let pokemon of this.typechart.team) {
      if (!pokemon.disabled) {
        for (let t in this.types) {
          if (pokemon.types.includes(this.types[t])) this.counts[t]++;
          if (pokemon.weak[this.types[t]] > 1) {
            this.weaknesses[t]++;
            this.difference[t]--;
          } else if (pokemon.weak[this.types[t]] < 1) {
            this.resistances[t]++;
            this.difference[t]++;
          }
          if (pokemon.weak[this.types[t]] > 0) {
            this.differential[t] -= Math.log2(pokemon.weak[this.types[t]]);
          } else {
            this.differential[t] += 2;
          }
        }
      }
    }
  }
}
