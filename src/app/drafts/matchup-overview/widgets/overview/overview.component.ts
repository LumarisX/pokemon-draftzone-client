import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { compare } from '../../../../util';
import { Summary } from '../../matchup-interface';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';
import { DraftPokemon } from '../../../../interfaces/draft';
import { StatsTable } from '../../../../data';

@Component({
  selector: 'overview',
  standalone: true,
  templateUrl: './overview.component.html',
  styleUrls: ['../../matchup.scss', './overview.component.scss'],
  imports: [
    CommonModule,
    SpriteComponent,
    MatSortModule,
    MatTooltipModule,
    MatIconModule,
  ],
})
export class OverviewComponent {
  private _teams: Summary[] = [];
  $teams = new BehaviorSubject<
    (DraftPokemon & {
      abilities: string[];
      index: number;
      types: string[];
      bst: number;
      baseStats: StatsTable;
    })[][]
  >([]);

  @Input()
  set teams(value: Summary[]) {
    this._teams = value;
    this.$teams.next(value.map((team) => team.team));
  }

  get teams() {
    return this._teams;
  }
  sortedBy: 'spe' | 'name' | null = null;
  sortDirection: 'asc' | 'desc' | null = null;
  sortData(sortKey: 'spe' | 'name') {
    if (sortKey === this.sortedBy) {
      if (this.sortDirection === 'asc') {
        this.sortedBy = null;
        this.sortDirection = null;
        this.$teams.next(this.teams.map((team) => team.team));
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = 'asc';
        this.$teams.next(this.$teams.value.map((team) => team.reverse()));
      }
    } else {
      if (sortKey === 'name') {
        this.$teams.next(
          this.teams.map((team) =>
            [...team.team].sort((x, y) => x.name.localeCompare(y.name)),
          ),
        );
      } else if (sortKey === 'spe') {
        this.$teams.next(
          this.teams.map((team) =>
            [...team.team].sort((x, y) => y.baseStats.spe - x.baseStats.spe),
          ),
        );
      }
      this.sortedBy = sortKey;
      this.sortDirection = 'desc';
    }
  }
}
