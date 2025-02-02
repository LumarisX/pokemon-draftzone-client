import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { TypeChart } from '../../matchup-interface';
import { ExtendedType, TYPES } from '../../../../data';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent, FormsModule, ReactiveFormsModule],
})
export class TypechartComponent implements OnChanges {
  @Input() typecharts!: TypeChart[];
  sortedType?: ExtendedType;
  selectedTeam: number = 1;
  types = TYPES;
  weaknesses: number[] = [];
  resistances: number[] = [];
  difference: number[] = [];
  differential: number[] = [];

  _abilities: boolean = true;
  set abilities(value: boolean) {
    this._abilities = value;
    this.summerize();
  }

  get abilities() {
    return this._abilities;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.summerize();
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.typecharts.length;
    this.summerize();
  }

  sortByType(type: ExtendedType) {
    if (type != this.sortedType) {
      this.typecharts.forEach((typechart) =>
        typechart.team.sort(
          (x, y) =>
            x.weak[this.useAbilities()][type] -
            y.weak[this.useAbilities()][type],
        ),
      );
      this.sortedType = type;
    } else {
      this.typecharts.forEach((typechart) => typechart.team.reverse());
    }
  }

  typeColor(weak: number, disbaled: Boolean): string {
    if (disbaled) return 'text-transparent border-menu-200';
    if (weak > 4)
      return 'bg-scale-negative-5 border-scale-negative-6 text-scale-negative-text';
    if (weak > 2)
      return 'bg-scale-negative-4  border-scale-negative-5 text-scale-negative-text';
    if (weak > 1)
      return 'bg-scale-negative-3  border-scale-negative-4 text-scale-negative-text';
    if (weak < 0.25)
      return 'bg-scale-positive-5  border-scale-positive-6 text-scale-positive-text';
    if (weak < 0.5)
      return 'bg-scale-positive-4  border-scale-positive-5 text-scale-positive-text';
    if (weak < 1)
      return 'bg-scale-positive-3  border-scale-positive-4 text-scale-positive-text';
    return 'text-transparent border-menu-200';
  }

  weakColor(weak: number): string {
    if (weak > 5)
      return 'bg-scale-negative-5 border-scale-negative-6 text-scale-negative-text';
    if (weak > 4)
      return 'bg-scale-negative-4 border-scale-negative-5 text-scale-negative-text';
    if (weak > 3)
      return 'bg-scale-negative-3 border-scale-negative-4 text-scale-negative-text';
    if (weak < 1)
      return 'bg-scale-positive-5 border-scale-positive-6 text-scale-positive-text';
    if (weak < 2)
      return 'bg-scale-positive-4 border-scale-positive-5 text-scale-positive-text';
    if (weak < 3)
      return 'bg-scale-positive-3 border-scale-positive-4 text-scale-positive-text';
    return 'bg-scale-neutral border-menu-400';
  }

  resistColor(weak: number): string {
    if (weak > 4)
      return 'bg-scale-positive-5 border-scale-positive-6 text-scale-positive-text';
    if (weak > 3)
      return 'bg-scale-positive-4 border-scale-positive-5 text-scale-positive-text';
    if (weak > 2)
      return 'bg-scale-positive-3 border-scale-positive-4 text-scale-positive-text';
    if (weak < 1)
      return 'bg-scale-negative-4 border-scale-negative-5 text-scale-negative-text';
    if (weak < 2)
      return 'bg-scale-negative-3 border-scale-negative-4 text-scale-negative-text';
    return 'bg-scale-neutral border-menu-400';
  }

  diffColor(weak: number): string {
    if (weak > 3)
      return 'bg-scale-positive-6 border-scale-positive-7 text-scale-positive-text';
    if (weak > 2)
      return 'bg-scale-positive-5 border-scale-positive-6 text-scale-positive-text';
    if (weak > 1)
      return 'bg-scale-positive-4 border-scale-positive-5 text-scale-positive-text';
    if (weak > 0)
      return 'bg-scale-positive-3 border-scale-positive-4 text-scale-positive-text';
    if (weak < -2)
      return 'bg-scale-negative-5 border-scale-negative-6 text-scale-negative-text';
    if (weak < -1)
      return 'bg-scale-negative-4 border-scale-negative-5 text-scale-negative-text';
    if (weak < 0)
      return 'bg-scale-negative-3 border-scale-negative-4 text-scale-negative-text';
    return 'bg-scale-neutral border-menu-400';
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-aTeam-300';
    return 'bg-bTeam-300';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-aTeam-300 hover:bg-aTeam-200 cursor-pointer';
    return 'bg-bTeam-300 hover:bg-bTeam-200 cursor-pointer';
  }

  toggleVisible(
    pokemon: Pokemon & {
      weak: [
        {
          [key in ExtendedType]: number;
        },
        {
          [key in ExtendedType]: number;
        },
      ];
      disabled?: Boolean;
    },
  ) {
    pokemon.disabled = !pokemon.disabled;
    this.summerize();
  }

  sortedTypeColor(type: ExtendedType) {
    if (type === this.sortedType) return 'bg-menu-800';
    else return 'bg-menu-300';
  }

  summerize() {
    this.weaknesses = new Array(this.types.length).fill(0);
    this.resistances = new Array(this.types.length).fill(0);
    this.difference = new Array(this.types.length).fill(0);
    this.differential = new Array(this.types.length).fill(0);
    for (let pokemon of this.typecharts[this.selectedTeam].team) {
      if (!pokemon.disabled) {
        for (let t in this.types) {
          if (pokemon.weak[this.useAbilities()][this.types[t]] > 1) {
            this.weaknesses[t]++;
            this.difference[t]--;
          } else if (pokemon.weak[this.useAbilities()][this.types[t]] < 1) {
            this.resistances[t]++;
            this.difference[t]++;
          }
          if (pokemon.weak[this.useAbilities()][this.types[t]] > 0) {
            this.differential[t] -= Math.log2(
              pokemon.weak[this.useAbilities()][this.types[t]],
            );
          } else {
            this.differential[t] += 2;
          }
        }
      }
    }
  }

  useAbilities(): number {
    return this.abilities ? 0 : 1;
  }
}
