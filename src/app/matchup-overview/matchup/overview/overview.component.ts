import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { ZSVG } from '../../../images/svg-components/z.component';
import { TeraComponent } from '../../../images/tera.component';
import { Summary } from '../../matchup-interface';
import { MatSortModule, Sort } from '@angular/material/sort';
import { compare } from '../../../util';
import { Pokemon } from '../../../interfaces/draft';
import { StatsTable } from '../../../data';

@Component({
  selector: 'overview',
  standalone: true,
  templateUrl: './overview.component.html',
  imports: [CommonModule, SpriteComponent, MatSortModule, ZSVG, TeraComponent],
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
