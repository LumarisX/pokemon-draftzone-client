import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { SpriteComponent } from '../../../images/sprite.component';
import { TypeChart, Types } from '../../matchup-interface';
import { Pokemon } from '../../../interfaces/draft';

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent],
})
export class TypechartComponent implements OnChanges {
  @Input() typecharts!: TypeChart[];
  selectedTeam: number = 1;
  types: (keyof Types)[] = [
    'Normal',
    'Grass',
    'Water',
    'Fire',
    'Electric',
    'Ground',
    'Rock',
    'Flying',
    'Ice',
    'Fighting',
    'Poison',
    'Bug',
    'Psychic',
    'Dark',
    'Ghost',
    'Dragon',
    'Steel',
    'Fairy',
  ];

  weaknesses: number[] = [];
  resistances: number[] = [];
  difference: number[] = [];
  differential: number[] = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    this.summerize();
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.typecharts.length;
    this.summerize();
  }

  typeColor(weak: number, disbaled: Boolean): string {
    if (disbaled) return 'text-transparent border-slate-200';
    if (weak > 4) return 'bg-rose-600 border-rose-700';
    if (weak > 2) return 'bg-rose-500  border-rose-600';
    if (weak > 1) return 'bg-rose-400  border-rose-500';
    if (weak < 0.25) return 'bg-emerald-600  border-emerald-700';
    if (weak < 0.5) return 'bg-emerald-500  border-emerald-600';
    if (weak < 1) return 'bg-emerald-400  border-emerald-500';
    return 'text-transparent border-slate-200';
  }

  weakColor(weak: number): string {
    if (weak > 5) return 'bg-rose-600 border-rose-700';
    if (weak > 4) return 'bg-rose-500  border-rose-600';
    if (weak > 3) return 'bg-rose-400  border-rose-500';
    if (weak < 1) return 'bg-emerald-600  border-emerald-700';
    if (weak < 2) return 'bg-emerald-500  border-emerald-600';
    if (weak < 3) return 'bg-emerald-400 border-emerald-500';
    return 'border-slate-400';
  }

  resistColor(weak: number): string {
    if (weak > 4) return 'bg-emerald-600 border-emerald-700';
    if (weak > 3) return 'bg-emerald-500 border-emerald-600';
    if (weak > 2) return 'bg-emerald-400 border-emerald-500';
    if (weak < 1) return 'bg-rose-500 border-rose-600';
    if (weak < 2) return 'bg-rose-400 border-rose-500';
    return 'border-slate-400';
  }

  diffColor(weak: number): string {
    if (weak > 3) return 'bg-emerald-700 border-emerald-800';
    if (weak > 2) return 'bg-emerald-600 border-emerald-700';
    if (weak > 1) return 'bg-emerald-500 border-emerald-600';
    if (weak > 0) return 'bg-emerald-400 border-emerald-500';
    if (weak < -2) return 'bg-rose-600 border-rose-700';
    if (weak < -1) return 'bg-rose-500 border-rose-600';
    if (weak < 0) return 'bg-rose-400 border-rose-500';
    return 'border-slate-400';
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-cyan-400';
    return 'bg-red-400';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-cyan-400 hover:bg-cyan-300 cursor-pointer';
    return 'bg-red-400 hover:bg-red-300 cursor-pointer';
  }

  toggleVisible(
    pokemon: Pokemon & {
      weak: Types;
      disabled?: Boolean;
    }
  ) {
    pokemon.disabled = !pokemon.disabled;
    console.log(pokemon);
    this.summerize();
  }

  summerize() {
    this.weaknesses = new Array(this.types.length).fill(0);
    this.resistances = new Array(this.types.length).fill(0);
    this.difference = new Array(this.types.length).fill(0);
    this.differential = new Array(this.types.length).fill(0);
    for (let pokemon of this.typecharts[this.selectedTeam].team) {
      if (!pokemon.disabled) {
        for (let t in this.types) {
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
