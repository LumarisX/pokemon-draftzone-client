import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  Summary,
  SummaryPokemon,
} from '@pdz/features/drafts/matchup-overview/matchup-interface';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

type SortKey = 'name' | 'spe';
type SortState = { key: SortKey; direction: 'asc' | 'desc' } | null;

const ALL_TERA_TYPES = 19;
const ALL_Z_TYPES = 18;

@Component({
  selector: 'pdz-overview',
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  imports: [
    ButtonComponent,
    CardComponent,
    IconComponent,
    NgTemplateOutlet,
    SpriteComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent {
  readonly teams = input.required<Summary[]>();

  readonly sort = signal<SortState>(null);

  readonly sides = computed(() => {
    const sort = this.sort();
    return this.teams().map((team, index) => ({
      slot: index === 0 ? 'team1' : 'team2',
      name: `${team.teamName}`,
      coach: team.coach,
      pokemon: sort ? sortPokemon(team.team, sort) : team.team,
    }));
  });

  readonly showCoach = computed(() =>
    this.teams().some((team) => !!team.coach),
  );

  toggleSort(key: SortKey): void {
    this.sort.update((current) => {
      if (current?.key !== key) return { key, direction: 'desc' };
      if (current.direction === 'desc') return { key, direction: 'asc' };
      return null;
    });
  }

  sortIcon(key: SortKey): string | null {
    const sort = this.sort();
    if (sort?.key !== key) return null;
    return sort.direction === 'desc' ? 'arrow_downward' : 'arrow_upward';
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    if (sort?.key !== key) return 'none';
    return sort.direction === 'desc' ? 'descending' : 'ascending';
  }

  captTypes(types: string[] | undefined, all: 'tera' | 'z'): string {
    const limit = all === 'tera' ? ALL_TERA_TYPES : ALL_Z_TYPES;
    return types?.length && types.length < limit
      ? types.join(', ')
      : 'All types';
  }
}

function sortPokemon(
  pokemon: SummaryPokemon[],
  sort: NonNullable<SortState>,
): SummaryPokemon[] {
  const direction = sort.direction === 'desc' ? 1 : -1;
  return [...pokemon].sort((a, b) =>
    sort.key === 'name'
      ? a.name.localeCompare(b.name) * direction
      : (b.baseStats.spe - a.baseStats.spe) * direction,
  );
}
