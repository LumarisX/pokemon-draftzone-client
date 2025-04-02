import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { compare } from '../../../../util';
import { Summary } from '../../matchup-interface';

@Component({
  selector: 'overview',
  standalone: true,
  templateUrl: './overview.component.html',
  styleUrls: ['../../matchup.scss', './overview.component.scss'],
  imports: [CommonModule, SpriteComponent, MatSortModule, MatIconModule],
})
export class OverviewComponent {
  _teams: Summary[] = [];

  @Input()
  set teams(value: Summary[]) {
    this._teams = value;
  }

  get teams() {
    return this._teams;
  }
  constructor() {}

  sortData(sort: Sort) {
    let { direction, active } = sort;
    if (direction === '') {
      direction = 'asc';
      active = 'index';
    }
    const isAsc = direction === 'asc';
    for (let player of this.teams) {
      player.team.sort((a, b) => {
        switch (active) {
          case 'name':
            return compare(a.name, b.name, isAsc);
          case 'index':
            return compare(a.index, b.index, isAsc);
          case 'hp':
          case 'atk':
          case 'def':
          case 'spa':
          case 'spd':
          case 'spe':
            return compare(a.baseStats[active], b.baseStats[active], isAsc);
          default:
            return 0;
        }
      });
    }
    return 0;
  }
}
