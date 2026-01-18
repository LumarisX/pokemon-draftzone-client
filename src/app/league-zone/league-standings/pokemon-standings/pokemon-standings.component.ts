import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule, Sort } from '@angular/material/sort';
import { getRandomPokemon } from '../../../data/namedex';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';

const DEFAULT_STANDINGS: League.PokemonStanding[] = [
  {
    teamName: `Philadelphia Flygons`,
    coach: '02ThatOneGuy',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Mighty Murkrow`,
    coach: 'hsoj',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Fitchburg's Sun Chasers`,
    coach: 'Feather',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Chicago White Fox`,
    coach: 'TheNotoriousABS',
    direction: 1,
    ...getRandomPokemon(),
  },
  {
    teamName: `Deimos Deoxys`,
    coach: 'Lumaris',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Alpine Arcanines`,
    coach: 'Lion',
    direction: 1,
    ...getRandomPokemon(),
  },
  {
    teamName: `Victorious Vigoroths`,
    coach: 'Speedy',
    direction: -1,
    ...getRandomPokemon(),
  },
  {
    teamName: `Deep Sea Duskulls`,
    coach: 'Emeglebon',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Twinleaf Tatsugiri`,
    coach: 'Penic',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `I like 'em THICC`,
    coach: 'Kat',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `London Vespiquens`,
    coach: 'Jake W',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Tampa T-Chainz`,
    coach: 'Spite',
    direction: -1,
    ...getRandomPokemon(),
  },
  {
    teamName: `Kalos Quagsires`,
    coach: 'Caltech_',
    direction: 1,
    ...getRandomPokemon(),
  },
  {
    teamName: `Montreal Mean Mareanies`,
    coach: 'Qofol',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Chicago Sky Attack`,
    coach: 'Quincy',
    direction: 0,
    ...getRandomPokemon(),
  },
  {
    teamName: `Midnight Teddy's`,
    coach: 'neb5',
    direction: 0,
    ...getRandomPokemon(),
  },
].map((pokemon) => {
  const kills = Math.round(Math.random() * 20);
  const deaths = Math.round(Math.random() * 20);
  return {
    ...pokemon,
    record: {
      kills,
      brought: Math.round(Math.random() * 20),
      deaths,
      diff: kills - deaths,
    },
  };
});

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [MatIconModule, SpriteComponent, MatSortModule, PlusSignPipe],
  templateUrl: './pokemon-standings.component.html',
  styleUrls: ['./pokemon-standings.component.scss'],
})
export class PokemonStandingsComponent implements OnChanges {
  @Input() standingData: League.PokemonStanding[] = [];
  sortedData: League.PokemonStanding[] = DEFAULT_STANDINGS;
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
