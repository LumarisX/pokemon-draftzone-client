import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  scan,
  startWith,
  switchMap,
} from 'rxjs';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  StartTournamentData,
  StartTournamentDialogComponent,
} from '../start-tournament-dialog/start-tournament-dialog.component';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { DataService } from '@pdz/core/services/data.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PokemonSearchComponent } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListCardComponent } from '../tier-list-card/tier-list-card.component';
import {
  TierListBrowseResult,
  TierListService,
  TierListSort,
  TierListSummary,
} from '../tier-list.service';

const PAGE_SIZE = 24;

type Criteria = {
  query: string;
  format: string;
  ruleset: string;
  tag: string;
  pokemon: string;
  sort: TierListSort;
};

type Results = {
  lists: TierListSummary[];
  total: number;
  loading: boolean;
  failed: boolean;
};

@Component({
  selector: 'pdz-tier-list-browse',
  imports: [
    FormsModule,
    NgTemplateOutlet,
    RouterLink,
    ButtonComponent,
    ChipComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    PokemonSearchComponent,
    SelectComponent,
    SelectOptionComponent,
    SkeletonLayoutComponent,
    TierListCardComponent,
  ],
  templateUrl: './tier-list-browse.component.html',
  styleUrl: './tier-list-browse.component.scss',
})
export class TierListBrowseComponent {
  private readonly tierListService = inject(TierListService);
  private readonly dataService = inject(DataService);
  private readonly authService = inject(AuthService);
  private readonly toasts = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);

  protected readonly tierListPath = TIER_LIST_PATH;

  protected readonly query = signal('');
  protected readonly format = signal('');
  protected readonly ruleset = signal('');
  protected readonly tag = signal('');
  protected readonly pokemon = signal<{ id: string; name: string } | null>(null);
  protected readonly sort = signal<TierListSort>('updated');
  protected readonly page = signal(0);
  protected readonly forking = signal<string | null>(null);
  private readonly retry = signal(0);
  private readonly page$ = toObservable(this.page);

  protected readonly sortOptions: { value: TierListSort; label: string }[] = [
    { value: 'updated', label: 'Recently Updated' },
    { value: 'uses', label: 'Most Used' },
    { value: 'forks', label: 'Most Forked' },
    { value: 'name', label: 'Name' },
  ];

  protected readonly isAuthenticated = toSignal(
    this.authService.isAuthenticated$,
    { initialValue: false },
  );

  protected readonly formats = toSignal(
    this.dataService.getFormatsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  protected readonly rulesets = toSignal(
    this.dataService.getRulesetsLegacy().pipe(catchError(() => of([]))),
    { initialValue: [] as string[] },
  );

  private readonly criteria = computed<Criteria & { retry: number }>(() => ({
    query: this.query().trim(),
    format: this.format(),
    ruleset: this.ruleset(),
    tag: this.tag().trim(),
    pokemon: this.pokemon()?.id ?? '',
    sort: this.sort(),
    retry: this.retry(),
  }));

  protected readonly hasFilters = computed(() => {
    const criteria = this.criteria();
    return (
      !!criteria.query ||
      !!criteria.format ||
      !!criteria.ruleset ||
      !!criteria.tag ||
      !!criteria.pokemon
    );
  });

  protected readonly featured = toSignal(
    this.tierListService
      .browse({ scope: 'featured', limit: 6 })
      .pipe(
        map((result) => result.tierLists),
        catchError(() => of([] as TierListSummary[])),
      ),
    { initialValue: [] as TierListSummary[] },
  );

  protected readonly results = toSignal(
    toObservable(this.criteria).pipe(
      debounceTime(250),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap((criteria) =>
        this.page$.pipe(
          startWith(0),
          distinctUntilChanged(),
          switchMap((page) =>
            this.tierListService
              .browse({
                scope: 'public',
                q: criteria.query || undefined,
                format: criteria.format || undefined,
                ruleset: criteria.ruleset || undefined,
                tag: criteria.tag || undefined,
                pokemon: criteria.pokemon || undefined,
                sort: criteria.sort,
                limit: PAGE_SIZE,
                skip: page * PAGE_SIZE,
              })
              .pipe(
                map((result) => ({ page, result, failed: false })),
                catchError(() =>
                  of({
                    page,
                    result: null as TierListBrowseResult | null,
                    failed: true,
                  }),
                ),
                startWith({ page, result: null, failed: false, loading: true }),
              ),
          ),
          scan(
            (acc: Results, step) => {
              if ('loading' in step)
                return { ...acc, loading: true, failed: false };
              if (step.failed || !step.result)
                return { ...acc, loading: false, failed: true };
              const lists =
                step.page === 0
                  ? step.result.tierLists
                  : [...acc.lists, ...step.result.tierLists];
              return {
                lists,
                total: step.result.total,
                loading: false,
                failed: false,
              };
            },
            { lists: [], total: 0, loading: true, failed: false } as Results,
          ),
        ),
      ),
    ),
    { initialValue: { lists: [], total: 0, loading: true, failed: false } as Results },
  );

  protected readonly canLoadMore = computed(() => {
    const results = this.results();
    return !results.loading && results.lists.length < results.total;
  });

  protected setFilter(apply: () => void): void {
    this.page.set(0);
    apply();
  }

  protected setPokemon(pokemon: DraftPokemon): void {
    this.setFilter(() => this.pokemon.set({ id: pokemon.id, name: pokemon.name }));
  }

  protected clearFilters(): void {
    this.setFilter(() => {
      this.query.set('');
      this.format.set('');
      this.ruleset.set('');
      this.tag.set('');
      this.pokemon.set(null);
    });
  }

  protected loadMore(): void {
    this.page.update((page) => page + 1);
  }

  protected reload(): void {
    this.page.set(0);
    this.retry.update((value) => value + 1);
  }

  protected startTournament(list: TierListSummary): void {
    this.dialogs.open<StartTournamentDialogComponent, void, StartTournamentData>(
      StartTournamentDialogComponent,
      {
        heading: 'Start a Tournament',
        subheading: 'Pick the league to host it in.',
        size: 'sm',
        data: { slug: list.slug, name: list.name },
      },
    );
  }

  protected forkList(list: TierListSummary): void {
    if (this.forking()) return;
    this.forking.set(list.slug);

    this.tierListService.fork(list.slug).subscribe({
      next: (created) => {
        this.forking.set(null);
        this.toasts.success(`Created "${created.name}".`);
        this.router.navigate(['/', TIER_LIST_PATH, created.slug, 'edit']);
      },
      error: (err) => {
        this.forking.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not copy that tier list.'));
      },
    });
  }
}
