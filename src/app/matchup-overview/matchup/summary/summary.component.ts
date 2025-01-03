import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Summary } from '../../matchup-interface';
import { TeraComponent } from '../../../images/tera.component';
import { ZSVG } from '../../../images/svg-components/z.component';
import { Sort, MatSortModule } from '@angular/material/sort';
import { Pokemon } from '../../../interfaces/draft';
import { StatsTable } from '../../../data';
import { compare } from '../../../util';

@Component({
  selector: 'summary',
  standalone: true,
  templateUrl: './summary.component.html',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    ZSVG,
    MatSortModule,
    TeraComponent,
  ],
})
export class SummaryComponent {
  _summaries: Summary[] = [];

  @Input()
  set summaries(value: Summary[]) {
    this._summaries = value;
    this.teams = (
      JSON.parse(JSON.stringify(this.summaries.slice())) as Summary[]
    ).map((summary) =>
      summary.team.sort((a, b) =>
        compare(a.baseStats.spe, b.baseStats.spe, false),
      ),
    );
  }

  get summaries() {
    return this._summaries;
  }

  teams: (Pokemon & {
    abilities: string[];
    types: string[];
    bst: number;
    baseStats: StatsTable;
  })[][] = [];

  selectedTeam: number = 1;
  reversed: boolean = false;
  baseValue: number = 80;

  constructor() {}

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return 0;
    }
    for (let team of this.teams) {
      team.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name':
            return compare(a.name, b.name, isAsc);
          case 'hp':
          case 'atk':
          case 'def':
          case 'spa':
          case 'spd':
          case 'spe':
            return compare(
              a.baseStats[sort.active],
              b.baseStats[sort.active],
              isAsc,
            );
          default:
            return 0;
        }
      });
    }
    return 0;
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-aTeam-300';
    return 'bg-bTeam-300';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-aTeam-300 hover:bg-aTeam-300';
    return 'bg-bTeam-300 hover:bg-bTeam-300';
  }

  statColor(statValue: number | undefined) {
    if (statValue === undefined) {
      return;
    }
    if (statValue > this.baseValue + 67)
      return 'bg-scale-positive-5 text-scale-positive-text';
    if (statValue > this.baseValue + 52)
      return 'bg-scale-positive-4 text-scale-positive-text';
    if (statValue > this.baseValue + 37)
      return 'bg-scale-positive-3 text-scale-positive-text';
    if (statValue > this.baseValue + 22)
      return 'bg-scale-positive-2 text-scale-positive-text';
    if (statValue > this.baseValue + 7)
      return 'bg-scale-positive-1 text-scale-positive-text';
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return 'bg-menu-200';
    if (statValue < this.baseValue - 67)
      return 'bg-scale-negative-5 text-scale-negative-text';
    if (statValue < this.baseValue - 52)
      return 'bg-scale-negative-4 text-scale-negative-text';
    if (statValue < this.baseValue - 37)
      return 'bg-scale-negative-3 text-scale-negative-text';
    if (statValue < this.baseValue - 22)
      return 'bg-scale-negative-2 text-scale-negative-text';
    if (statValue < this.baseValue - 7)
      return 'bg-scale-negative-1 text-scale-negative-text';
    return;
  }
}
