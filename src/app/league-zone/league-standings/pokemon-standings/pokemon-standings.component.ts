import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';

type SortKey = 'brought' | 'kills' | 'deaths' | 'diff';

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [MatIconModule, SpriteComponent, PlusSignPipe],
  templateUrl: './pokemon-standings.component.html',
  styleUrls: ['./pokemon-standings.component.scss'],
})
export class PokemonStandingsComponent implements OnChanges {
  @Input({ required: true }) standingData!: League.PokemonStanding[];
  sortedData: League.PokemonStanding[] = [];
  @Input() showCount: number = 100;
  activeSort: SortKey = 'diff';
  isSortDescending: boolean = true;

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes['standingData'] || changes['showCount']) &&
      this.standingData.length > 0
    ) {
      this.applySort();
    }
  }

  sortData(sort: SortKey) {
    if (this.activeSort === sort) {
      this.isSortDescending = !this.isSortDescending;
    } else {
      this.activeSort = sort;
      this.isSortDescending = true;
    }

    this.applySort();
  }

  private applySort() {
    const data = this.standingData.slice();

    this.sortedData = data
      .sort((a, b) => {
        switch (this.activeSort) {
          case 'brought':
            return compare(
              a.record.brought,
              b.record.brought,
              this.isSortDescending,
            );
          case 'kills':
            return compare(
              a.record.kills,
              b.record.kills,
              this.isSortDescending,
            );
          case 'deaths':
            return compare(
              a.record.deaths,
              b.record.deaths,
              this.isSortDescending,
            );
          case 'diff':
            return compare(a.record.diff, b.record.diff, this.isSortDescending);
          default:
            return 0;
        }
      })
      .slice(0, this.showCount);
  }
}

function compare(
  a: number | string,
  b: number | string,
  isDescending: boolean,
) {
  if (a === b) {
    return 0;
  }

  if (isDescending) {
    return a < b ? 1 : -1;
  }

  return a < b ? -1 : 1;
}
