import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import {
  DraftService,
  PokemonStat,
} from '@pdz/features/drafts/draft-overview/draft.service';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { Sort, SortDirective } from '@pdz/shared/data/sort/sort.directive';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { catchError, map, of } from 'rxjs';

type SortKey = 'name' | 'gb' | 'dk' | 'ik' | 'deaths' | 'kdr' | 'kpg';

const SORT_VALUES: Record<SortKey, (stat: PokemonStat) => number | string> = {
  name: (stat) => stat.pokemon.name,
  gb: (stat) => stat.brought,
  dk: (stat) => stat.kills,
  ik: (stat) => stat.indirect,
  deaths: (stat) => stat.deaths,
  kdr: (stat) => stat.kdr,
  kpg: (stat) => stat.kpg,
};

@Component({
  selector: 'pdz-draft-stats',
  templateUrl: './draft-stats.component.html',
  styleUrl: './draft-stats.component.scss',
  imports: [
    DecimalPipe,
    EmptyStateComponent,
    SkeletonLayoutComponent,
    PageComponent,
    PageHeaderComponent,
    SortDirective,
    PokemonComponent,
    SortHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftStatsComponent {
  private readonly draftService = inject(DraftService);
  private readonly route = inject(ActivatedRoute);

  readonly backLink = ['/', LEAGUE_ZONE_PATH];

  private readonly stats = toSignal(this.loadStats());

  readonly sort = signal<Sort>({ active: '', direction: '' });

  readonly rows = computed(() => {
    const stats = this.stats();
    if (!stats) return null;
    const { active, direction } = this.sort();
    const value = SORT_VALUES[active as SortKey];
    if (!value || !direction) return stats;
    const factor = direction === 'asc' ? 1 : -1;
    return [...stats].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      if (typeof left === 'string' && typeof right === 'string') {
        return left.localeCompare(right) * factor;
      }
      return ((left as number) - (right as number)) * factor;
    });
  });

  private loadStats() {
    const teamId = this.route.snapshot.paramMap.get('teamId') ?? '';
    return this.draftService.getArchiveStats(teamId).pipe(
      map((data) => data.pokemon),
      catchError(() => of<PokemonStat[]>([])),
    );
  }
}
