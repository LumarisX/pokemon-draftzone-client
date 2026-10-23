import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListChangesComponent } from '../tier-list-changes/tier-list-changes.component';
import { tierListBase } from '../tier-list-links';
import {
  PickedTierList,
  TierListPickerComponent,
  TierListPickerData,
} from '../tier-list-picker/tier-list-picker.component';
import { TierListChange } from '../tier-list.model';
import { TierListService } from '../tier-list.service';

type Comparison = {
  base: { label: string; slug: string; version: number };
  target: { label: string; slug: string; version: number };
  changes: TierListChange[];
};

@Component({
  selector: 'pdz-tier-list-compare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
    TierListChangesComponent,
  ],
  template: `
    <pdz-page type="detail">
      <pdz-page-header
        title="Compare"
        [subtitle]="comparison() ? comparison()!.base.label + ' → ' + comparison()!.target.label : undefined"
        [backLink]="backLink()"
        backLabel="Back to the List"
      >
        <button
          pdz-page-header-actions
          pdz-button
          variant="outlined"
          color="neutral"
          icon="compare_arrows"
          [disabled]="!slug()"
          (click)="pickOther()"
        >
          Compare With Another List
        </button>
      </pdz-page-header>

      @if (error(); as message) {
        <pdz-empty-state
          kind="error"
          heading="The comparison didn't load"
          [message]="message"
          retry="event"
          (retried)="load()"
        />
      } @else if (comparison(); as result) {
        <pdz-card padding="lg">
          <p class="compare__intro">
            What changes going from {{ result.base.label }} to {{ result.target.label }}.
          </p>
          <pdz-tier-list-changes
            [changes]="result.changes"
            emptyText="These two are the same."
          />
        </pdz-card>
      } @else {
        <pdz-skeleton-layout layout="list" [count]="6" />
      }
    </pdz-page>
  `,
  styleUrl: './tier-list-compare.component.scss',
})
export class TierListCompareComponent implements OnInit {
  private readonly tierLists = inject(TierListService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly league = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly slug = signal<string | null>(null);
  protected readonly comparison = signal<Comparison | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly backLink = computed(() => tierListBase(this.league, this.slug()));

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  protected load(): void {
    this.error.set(null);
    this.comparison.set(null);
    const params = this.route.snapshot.queryParamMap;
    const routed = this.route.snapshot.paramMap.get('tierListSlug');
    const rev = params.get('rev');
    const other = params.get('with') ?? undefined;
    const slug$ = routed ? of(routed) : this.tierLists.resolveTierListId();

    slug$
      .pipe(
        switchMap((slug) => {
          this.slug.set(slug);
          return this.tierLists.compare(slug, {
            with: other,
            rev: rev !== null ? Number(rev) : undefined,
          });
        }),
      )
      .subscribe({
        next: (result) => {
          this.slug.set(result.target.slug);
          this.comparison.set(result);
        },
        error: (err) =>
          this.error.set(apiErrorMessage(err, "The two lists couldn't be compared.")),
      });
  }

  protected async pickOther(): Promise<void> {
    const picked = await this.dialogs.open<
      TierListPickerComponent,
      PickedTierList,
      TierListPickerData
    >(TierListPickerComponent, {
      heading: 'Compare With',
      size: 'md',
      data: { exclude: this.slug() ?? undefined },
    }).closed;
    if (!picked) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { with: picked.slug, rev: null },
      queryParamsHandling: 'merge',
    });
  }
}
