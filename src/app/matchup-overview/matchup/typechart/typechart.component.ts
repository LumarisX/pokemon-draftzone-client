import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { TypeChart, Types } from '../../matchup-interface';

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent],
})
export class TypechartComponent implements OnInit {
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
  
  weaknesses = {}
  resistances = {}
  difference = {}
  differential = {}

  constructor() {}
  
  ngOnInit(){
    summerize()
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.typecharts.length;
  }

  typeColor(weak: number): string {
    if (weak > 4) return 'bg-rose-600';
    if (weak > 2) return 'bg-rose-500';
    if (weak > 1) return 'bg-rose-400';
    if (weak < 0.25) return 'bg-emerald-600';
    if (weak < 0.5) return 'bg-emerald-500';
    if (weak < 1) return 'bg-emerald-400';
    return 'text-transparent';
  }

  weakColor(weak: number): string {
    if (weak > 5) return 'bg-rose-600';
    if (weak > 4) return 'bg-rose-500';
    if (weak > 3) return 'bg-rose-400';
    if (weak < 1) return 'bg-emerald-600';
    if (weak < 2) return 'bg-emerald-500';
    if (weak < 3) return 'bg-emerald-400';
    return '';
  }

  resistColor(weak: number): string {
    if (weak > 4) return 'bg-emerald-600';
    if (weak > 3) return 'bg-emerald-500';
    if (weak > 2) return 'bg-emerald-400';
    if (weak < 1) return 'bg-rose-500';
    if (weak < 2) return 'bg-rose-400';
    return '';
  }

  diffColor(weak: number): string {
    if (weak > 3) return 'bg-emerald-700';
    if (weak > 2) return 'bg-emerald-600';
    if (weak > 1) return 'bg-emerald-500';
    if (weak > 0) return 'bg-emerald-400';
    if (weak < -2) return 'bg-rose-600';
    if (weak < -1) return 'bg-rose-500';
    if (weak < 0) return 'bg-rose-400';
    return '';
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-cyan-400';
    return 'bg-red-400';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-cyan-400 hover:bg-cyan-300';
    return 'bg-red-400 hover:bg-red-300';
  }
  
  summerize() {
    for (let t of this.types) {
      this.weaknesses[t] = 0
      this.resistances[t] = 0
      this.difference[t] = 0
      this.differential[t] = 0
    }
    for (let pokemon of this.typecharts[selectedTeam].team) {
      for (let t of this.types) {
        if (pokemon.weak[t] > 1) {
          this.weaknesses[t]++
          this.difference[t]--
        } else if (pokemon.weak[t] < 1) {
          this.resistances[type]++
          this.difference[type]++
        }
        if (pokemon.weak[type] > 0) {
          this.differential[type] -= Math.log2(pokemon.weak[type])
        } else {
          this.differential[type] += 2
        }
      }
    }
  }
}
