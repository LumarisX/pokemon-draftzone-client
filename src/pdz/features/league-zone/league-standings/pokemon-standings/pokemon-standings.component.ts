import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { League } from '@pdz/features/league-zone/league.interface';
import { BadgeTone } from '@pdz/shared/data/badge/badge.component';
import { ScoreComponent } from '@pdz/shared/data/score/score.component';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { Sort, SortDirective } from '@pdz/shared/data/sort/sort.directive';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { PlusSignPipe } from '@pdz/shared/pipes/plus-sign.pipe';

type SortKey = 'brought' | 'kills' | 'deaths' | 'diff';

const SORT_KEYS: SortKey[] = ['brought', 'kills', 'deaths', 'diff'];

@Component({
  selector: 'pdz-pokemon-standings',
  imports: [
    CheckComponent,
    ChoiceDirective,
    IconComponent,
    PlusSignPipe,
    ScoreComponent,
    SortDirective,
    SortHeaderComponent,
    PokemonComponent,
  ],
  templateUrl: './pokemon-standings.component.html',
  styleUrl: './pokemon-standings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonStandingsComponent {
  readonly standingData = input.required<League.PokemonStanding[]>();
  readonly showCount = input<number>(100);

  readonly sort = signal<{ key: SortKey; descending: boolean }>({
    key: 'diff',
    descending: true,
  });
  readonly combineTeams = signal(false);

  readonly rows = computed(() => {
    const data = this.combineTeams()
      ? combineByPokemon(this.standingData())
      : [...this.standingData()];
    const { key, descending } = this.sort();
    const direction = descending ? -1 : 1;
    return data
      .sort((a, b) => (a.record[key] - b.record[key]) * direction)
      .slice(0, this.showCount());
  });

  onSort(sort: Sort): void {
    const key = SORT_KEYS.find((candidate) => candidate === sort.active);
    if (!key) return;
    this.sort.set({ key, descending: sort.direction !== 'asc' });
  }

  diffTone(diff: number): BadgeTone {
    if (diff > 0) return 'success';
    if (diff < 0) return 'danger';
    return 'neutral';
  }
}

function combineByPokemon(
  standingData: League.PokemonStanding[],
): League.PokemonStanding[] {
  const groups = new Map<string, League.PokemonStanding[]>();
  for (const pokemon of standingData) {
    const group = groups.get(pokemon.id);
    if (group) group.push(pokemon);
    else groups.set(pokemon.id, [pokemon]);
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
