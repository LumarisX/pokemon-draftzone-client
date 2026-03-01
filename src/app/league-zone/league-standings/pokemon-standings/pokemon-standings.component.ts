import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { getRandomPokemon } from '../../../data/namedex';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [MatIconModule, SpriteComponent, MatSortModule, PlusSignPipe],
  templateUrl: './pokemon-standings.component.html',
  styleUrls: ['./pokemon-standings.component.scss'],
})
export class PokemonStandingsComponent implements OnChanges {
  @Input({ required: true }) standingData!: League.PokemonStanding[];
  sortedData: League.PokemonStanding[] = [];
  @Input() showCount: number = 20;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['standingData'] && this.standingData.length > 0) {
      this.sortedData = this.standingData.slice();
      this.sortData({ active: 'diff', direction: 'desc' });
    }
  }

  sortData(sort: Sort) {
    const data = this.standingData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data
      .sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'brought':
            return compare(a.record.brought, b.record.brought, isAsc);
          case 'kills':
            return compare(a.record.kills, b.record.kills, isAsc);
          case 'deaths':
            return compare(a.record.deaths, b.record.deaths, isAsc);
          case 'diff':
            return compare(a.record.diff, b.record.diff, isAsc);
          default:
            return 0;
        }
      })
      .slice(0, this.showCount);
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
