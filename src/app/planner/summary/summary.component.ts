import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Summary } from '../../matchup-overview/matchup-interface';
import { SpriteComponent } from '../../images/sprite.component';
import { TeraComponent } from '../../images/tera.component';

@Component({
  selector: 'summary',
  standalone: true,
  templateUrl: './summary.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent, TeraComponent],
})
export class SummaryComponent {
  _summary!: Summary;
  sortBy: 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | null = null;

  @Input()
  set summary(sum: Summary) {
    sum.team.sort((x, y) => {
      if (x['baseStats']['spe'] < y['baseStats']['spe']) {
        return 1;
      }
      if (x['baseStats']['spe'] > y['baseStats']['spe']) {
        return -1;
      }
      return 0;
    });

    this.sortBy = 'spe';
    this._summary = sum;
  }
  get summary(): Summary {
    return this._summary;
  }
  reversed: boolean = false;
  baseValue: number = 80;

  constructor() {}

  sortByStat(sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe') {
    if (sortStat != this.sortBy) {
      this.sortBy = sortStat;
      this.reversed = false;
      this.summary.team.sort((x, y) => {
        if (x['baseStats'][sortStat] < y['baseStats'][sortStat]) {
          return 1;
        }
        if (x['baseStats'][sortStat] > y['baseStats'][sortStat]) {
          return -1;
        }
        return 0;
      });
    } else {
      this.summary.team.reverse();
      this.reversed = !this.reversed;
    }
  }

  sortByName() {
    if ('name' != this.sortBy) {
      this.sortBy = 'name';
      this.reversed = true;
      this.summary.team.sort((x, y) => {
        if (x['name'] > y['name']) {
          return 1;
        }
        if (x['name'] < y['name']) {
          return -1;
        }
        return 0;
      });
    } else {
      this.summary.team.reverse();
      this.reversed = !this.reversed;
    }
  }

  statColor(statValue: number | undefined) {
    if (statValue === undefined) {
      return;
    }
    if (statValue > this.baseValue + 67)
      return 'bg-emerald-600 dark:bg-emerald-300';
    if (statValue > this.baseValue + 52)
      return 'bg-emerald-500 dark:bg-emerald-400';
    if (statValue > this.baseValue + 37)
      return 'bg-emerald-400 dark:bg-emerald-500';
    if (statValue > this.baseValue + 22)
      return 'bg-emerald-300 dark:bg-emerald-600';
    if (statValue > this.baseValue + 7)
      return 'bg-emerald-200 dark:bg-emerald-700';
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return 'bg-slate-200 dark:bg-slate-700';
    if (statValue < this.baseValue - 67) return 'bg-rose-600 dark:bg-rose-300';
    if (statValue < this.baseValue - 52) return 'bg-rose-500 dark:bg-rose-400';
    if (statValue < this.baseValue - 37) return 'bg-rose-400 dark:bg-rose-500';
    if (statValue < this.baseValue - 22) return 'bg-rose-300 dark:bg-rose-600';
    if (statValue < this.baseValue - 7) return 'bg-rose-200 dark:bg-rose-700';
    return;
  }
}
