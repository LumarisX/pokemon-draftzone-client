import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteComponent } from '../../../images/sprite.component';
import { Summary } from '../../matchup-interface';
import { TeraComponent } from '../../../images/tera.component';

@Component({
  selector: 'summary',
  standalone: true,
  templateUrl: './summary.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent, TeraComponent],
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

  sortByName() {
    if ('name' != this.sortBy) {
      this.sortBy = 'name';
      this.reversed = true;
      for (let team of this.teams) {
        team.team.sort((x, y) => {
          if (x['name'] > y['name']) {
            return 1;
          }
          if (x['name'] < y['name']) {
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

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
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

  statColor(statValue: number | undefined) {
    if (statValue === undefined) {
      return;
    }
    if (statValue > this.baseValue + 67) return 'bg-emerald-600';
    if (statValue > this.baseValue + 52) return 'bg-emerald-500';
    if (statValue > this.baseValue + 37) return 'bg-emerald-400';
    if (statValue > this.baseValue + 22) return 'bg-emerald-300';
    if (statValue > this.baseValue + 7) return 'bg-emerald-200';
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return 'bg-slate-200';
    if (statValue < this.baseValue - 67) return 'bg-rose-600';
    if (statValue < this.baseValue - 52) return 'bg-rose-500';
    if (statValue < this.baseValue - 37) return 'bg-rose-400';
    if (statValue < this.baseValue - 22) return 'bg-rose-300';
    if (statValue < this.baseValue - 7) return 'bg-rose-200';
    return;
  }
}
