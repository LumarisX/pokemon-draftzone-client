import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Summary } from '../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'planner-summary',
  standalone: true,
  templateUrl: './summary.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent],
})
export class SummaryComponent {
  _summary!: Summary;
  sortBy: 'name' | 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst' | null =
    null;

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
  baseBST: number = 500;

  sortByStat(sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' | 'bst') {
    if (sortStat != this.sortBy) {
      this.sortBy = sortStat;
      this.reversed = false;
      this.summary.team.sort((x, y) => {
        if (sortStat === 'bst') {
          if (x.bst < y.bst) return 1;
          if (x.bst > y.bst) return -1;
        } else {
          if (x['baseStats'][sortStat] < y['baseStats'][sortStat]) return 1;
          if (x['baseStats'][sortStat] > y['baseStats'][sortStat]) return -1;
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
    if (statValue > this.baseValue + 67) return 'bg-scale-positive-5';
    if (statValue > this.baseValue + 52) return 'bg-scale-positive-4';
    if (statValue > this.baseValue + 37) return 'bg-scale-positive-3';
    if (statValue > this.baseValue + 22) return 'bg-scale-positive-2';
    if (statValue > this.baseValue + 7) return 'bg-scale-positive-1';
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return 'bg-menu-200';
    if (statValue < this.baseValue - 67) return 'bg-scale-negative-5';
    if (statValue < this.baseValue - 52) return 'bg-scale-negative-4';
    if (statValue < this.baseValue - 37) return 'bg-scale-negative-3';
    if (statValue < this.baseValue - 22) return 'bg-scale-negative-2';
    if (statValue < this.baseValue - 7) return 'bg-scale-negative-1';
    return;
  }

  bstColor(bstValue: number | undefined): string | undefined {
    if (bstValue === undefined) return;
    const diff = bstValue - this.baseBST;
    if (diff > 150) return 'bg-scale-positive-7';
    if (diff > 125) return 'bg-scale-positive-6';
    if (diff > 100) return 'bg-scale-positive-5';
    if (diff > 75) return 'bg-scale-positive-4';
    if (diff > 50) return 'bg-scale-positive-3';
    if (diff > 25) return 'bg-scale-positive-2';
    if (diff > 0) return 'bg-scale-positive-1';
    if (diff > -25) return 'bg-menu-200';
    if (diff < -175) return 'bg-scale-negative-7';
    if (diff < -150) return 'bg-scale-negative-6';
    if (diff < -125) return 'bg-scale-negative-5';
    if (diff < -100) return 'bg-scale-negative-4';
    if (diff < -75) return 'bg-scale-negative-3';
    if (diff < -50) return 'bg-scale-negative-2';
    return 'bg-scale-negative-1';
  }
}
