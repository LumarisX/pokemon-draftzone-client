import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, map, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { TierListScope, TierListService, TierListSummary } from '../tier-list.service';

export type TierListPickerData = {
  exclude?: string;
  intro?: string;
};

export type PickedTierList = Pick<
  TierListSummary,
  'slug' | 'name' | 'format' | 'ruleset' | 'authorName'
>;

type PickerState = {
  lists: TierListSummary[] | null;
  failed: boolean;
};

@Component({
  selector: 'pdz-tier-list-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonLayoutComponent,
  ],
  template: `
    @if (data.intro) {
      <p class="picker__intro">{{ data.intro }}</p>
    }
    <div class="picker__controls">
      @if (signedIn()) {
        <pdz-segmented
          size="sm"
          aria-label="Which tier lists to show"
          [ngModel]="scope()"
          (ngModelChange)="scope.set($event)"
        >
          <pdz-segmented-option value="mine" label="Mine" />
          <pdz-segmented-option value="shared" label="Shared With Me" />
          <pdz-segmented-option value="public" label="Public" />
        </pdz-segmented>
      }
      <label pdz-field class="picker__search" label="Search">
        <input
          pdz-input
          size="sm"
          type="search"
          placeholder="Name or tag"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
        />
      </label>
    </div>

    @let current = state();
    @if (current.failed) {
      <pdz-empty-state
        size="sm"
        kind="error"
        heading="Tier lists didn't load"
        message="The tier lists didn't come back."
      />
    } @else if (current.lists === null) {
      <pdz-skeleton-layout layout="list" [count]="4" />
    } @else if (current.lists.length) {
      <ul class="picker__list">
        @for (list of current.lists; track list.id) {
          <li>
            <button class="picker__row" type="button" (click)="choose(list)">
              <span class="picker__name">{{ list.name }}</span>
              <span class="picker__meta">
                @if (list.authorName) {
                  by {{ list.authorName }} ·
                }
                {{ list.format }} · {{ list.ruleset }} · {{ list.pokemonCount }} Pokémon
              </span>
              <pdz-icon class="picker__go" name="chevron_right" [size]="20" aria-hidden="true" />
            </button>
          </li>
        }
      </ul>
    } @else {
      <pdz-empty-state
        size="sm"
        kind="empty"
        heading="No tier lists here"
        [message]="query() ? 'Nothing matches that search.' : emptyMessage()"
      />
    }
  `,
  styleUrl: './tier-list-picker.component.scss',
})
export class TierListPickerComponent {
  protected readonly ref = inject(DialogRef) as DialogRef<PickedTierList>;
  protected readonly data = (inject(DIALOG_DATA, { optional: true }) ??
    {}) as TierListPickerData;
  private readonly tierLists = inject(TierListService);

  protected readonly signedIn = toSignal(inject(AuthService).isAuthenticated$, {
    initialValue: false,
  });
  protected readonly scope = signal<TierListScope>('mine');
  protected readonly query = signal('');

  protected readonly emptyMessage = computed(() =>
    this.scope() === 'mine'
      ? "You haven't made a tier list yet."
      : this.scope() === 'shared'
        ? 'Nobody has shared a list with you.'
        : 'No public lists yet.',
  );

  private readonly request = computed(() => ({
    scope: this.signedIn() ? this.scope() : ('public' as TierListScope),
    q: this.query().trim(),
  }));

  protected readonly state = toSignal(
    toObservable(this.request).pipe(
      debounceTime(200),
      switchMap(({ scope, q }) =>
        this.tierLists.browse({ scope, q: q || undefined, limit: 30 }).pipe(
          map(
            (result): PickerState => ({
              lists: result.tierLists.filter((list) => list.slug !== this.data.exclude),
              failed: false,
            }),
          ),
          catchError(() => of<PickerState>({ lists: [], failed: true })),
          startWith<PickerState>({ lists: null, failed: false }),
        ),
      ),
    ),
    { initialValue: { lists: null, failed: false } as PickerState },
  );

  protected choose(list: TierListSummary): void {
    this.ref.close({
      slug: list.slug,
      name: list.name,
      format: list.format,
      ruleset: list.ruleset,
      authorName: list.authorName,
    });
  }
}
