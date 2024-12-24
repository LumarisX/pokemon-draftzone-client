import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Summary } from '../../matchup-interface';
import { TeraComponent } from '../../../images/tera.component';
import { ZSVG } from '../../../images/svg-components/z.component';
import { Sort, MatSortModule } from '@angular/material/sort';

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
  _teams: Summary[] = [];
  sortBy: 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | null = null;
  @Input()
  set teams(summaries: Summary[]) {
    for (let summary of summaries) {
      summary.team.sort((x, y) => {
        if (x['baseStats']['spe'] < y['baseStats']['spe']) {
          return 1;
        }
        if (x['baseStats']['spe'] > y['baseStats']['spe']) {
          return -1;
        }
        return 0;
      });
    }
    this.sortBy = 'spe';
    this._teams = summaries;
  }
  get teams(): Summary[] {
    return this._teams;
  }
  selectedTeam: number = 1;
  reversed: boolean = false;
  baseValue: number = 80;

  constructor() {}

  sortByStat(sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe') {
    if (sortStat != this.sortBy) {
      this.sortBy = sortStat;
      this.reversed = false;
      for (let team of this.teams) {
        team.team.sort((x, y) => {
          if (x['baseStats'][sortStat] < y['baseStats'][sortStat]) {
            return 1;
          }
          if (x['baseStats'][sortStat] > y['baseStats'][sortStat]) {
            return -1;
          }
          return 0;
        });
      }
    } else {
      for (let team of this.teams) {
        team.team.reverse();
      }
      this.reversed = !this.reversed;
    }
  }

  sortByName() {}

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') return;
    for (let team of this.teams) {
      team.team.sort((a, b) => {
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

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
