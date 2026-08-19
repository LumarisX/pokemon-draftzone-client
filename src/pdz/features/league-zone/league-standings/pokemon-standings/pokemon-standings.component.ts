import { Component, OnChanges, SimpleChanges, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';
import { League } from '../../league.interface';

type SortKey = 'brought' | 'kills' | 'deaths' | 'diff';

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [MatIconModule, SpriteComponent, PlusSignPipe],
  templateUrl: './pokemon-standings.component.html',
  styleUrls: ['./pokemon-standings.component.scss'],
})
export class PokemonStandingsComponent implements OnChanges {
  readonly standingData = input.required<League.PokemonStanding[]>();
  sortedData: League.PokemonStanding[] = [];
  readonly showCount = input<number>(100);
  activeSort: SortKey = 'diff';
  isSortDescending: boolean = true;
  combineTeams = false;

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes['standingData'] || changes['showCount']) &&
      this.standingData().length > 0
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

  toggleCombineTeams() {
    this.combineTeams = !this.combineTeams;
    this.applySort();
  }

  private applySort() {
    const data = this.combineTeams
      ? combineByPokemon(this.standingData())
      : this.standingData().slice();

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
      .slice(0, this.showCount());
  }
}

function combineByPokemon(
  standingData: League.PokemonStanding[],
): League.PokemonStanding[] {
  const groups = new Map<string, League.PokemonStanding[]>();
  for (const pokemon of standingData) {
    const group = groups.get(pokemon.id);
    if (group) {
      group.push(pokemon);
    } else {
      groups.set(pokemon.id, [pokemon]);
    }
  }

  return Array.from(groups.values()).map((group) => {
    const [first] = group;
    const brought = group.reduce((sum, p) => sum + p.record.brought, 0);
    const kills = group.reduce((sum, p) => sum + p.record.kills, 0);
    const deaths = group.reduce((sum, p) => sum + p.record.deaths, 0);
    const teamNames = [...new Set(group.map((p) => p.teamName))];

    return {
      ...first,
      direction: undefined,
      teamName:
        teamNames.length > 1 ? `${teamNames.length} Teams` : teamNames[0],
      coach: teamNames.join(', '),
      record: { brought, kills, deaths, diff: kills - deaths },
    };
  });
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
