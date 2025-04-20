import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { Pokemon } from '../../../interfaces/draft';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { getRandomPokemon } from '../../../data/namedex';
import { MatSortModule, Sort } from '@angular/material/sort';

export type StandingsPokemon = Pokemon & {
  direction: number;
  coaches: string[];
  teamName: string;
  record: {
    brought: number;
    kills: number;
    deaths: number;
    diff: number;
  };
};

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [
    CommonModule,
    MatIconModule,
    SpriteComponent,
    MatSortModule,
    PlusSignPipe,
  ],
  templateUrl: './pokemon-standings.component.html',
  styleUrl: './pokemon-standings.component.scss',
})
export class PokemonStandingsComponent {
  standingData = [
    {
      teamName: `Philadelphia Flygons`,
      coaches: ['02ThatOneGuy'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Mighty Murkrow`,
      coaches: ['hsoj'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Fitchburg's Sun Chasers`,
      coaches: ['Feather'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Chicago White Fox`,
      coaches: ['TheNotoriousABS'],
      direction: 1,
      ...getRandomPokemon(),
    },
    {
      teamName: `Deimos Deoxys`,
      coaches: ['Lumaris'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Alpine Arcanines`,
      coaches: ['Lion'],
      direction: 1,
      ...getRandomPokemon(),
    },
    {
      teamName: `Victorious Vigoroths`,
      coaches: ['Speedy'],
      direction: -1,
      ...getRandomPokemon(),
    },
    {
      teamName: `Deep Sea Duskulls`,
      coaches: ['Emeglebon'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Twinleaf Tatsugiri`,
      coaches: ['Penic'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `I like 'em THICC`,
      coaches: ['Kat'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `London Vespiquens`,
      coaches: ['Jake W'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Tampa T-Chainz`,
      coaches: ['Spite'],
      direction: -1,
      ...getRandomPokemon(),
    },
    {
      teamName: `Kalos Quagsires`,
      coaches: ['Caltech_'],
      direction: 1,
      ...getRandomPokemon(),
    },
    {
      teamName: `Montreal Mean Mareanies`,
      coaches: ['Qofol'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Chicago Sky Attack`,
      coaches: ['Quincy'],
      direction: 0,
      ...getRandomPokemon(),
    },
    {
      teamName: `Midnight Teddy's`,
      coaches: ['neb5'],
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
  sortedData: StandingsPokemon[];

  constructor() {
    this.sortedData = this.standingData.slice();
    this.sortData({ active: 'diff', direction: 'asc' });
  }

  sortData(sort: Sort) {
    const data = this.standingData.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'brought':
          return compare(a.record.brought, b.record.brought, !isAsc);
        case 'kills':
          return compare(a.record.kills, b.record.kills, !isAsc);
        case 'deaths':
          return compare(a.record.deaths, b.record.deaths, !isAsc);
        case 'diff':
          return compare(a.record.diff, b.record.diff, !isAsc);
        default:
          return 0;
      }
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
