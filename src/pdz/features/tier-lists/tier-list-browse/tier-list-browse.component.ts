import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AuthService } from '@pdz/core/services/auth0.service';
import { DataService } from '@pdz/core/services/data.service';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListService, TierListSummary } from '../tier-list.service';

type Scope = 'public' | 'mine';

@Component({
  selector: 'pdz-tier-list-browse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
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
  private readonly dialog = inject(DialogService);

  protected readonly tierListPath = TIER_LIST_PATH;

  protected readonly scope = signal<Scope>('public');
  protected readonly query = signal('');
  protected readonly format = signal('');
  protected readonly ruleset = signal('');
  protected readonly forking = signal<string | null>(null);
  protected readonly deleting = signal<string | null>(null);
  private readonly refresh = signal(0);

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

  private readonly criteria = computed(() => ({
    refresh: this.refresh(),
    scope: this.scope(),
    query: this.query(),
    format: this.format(),
    ruleset: this.ruleset(),
  }));

  protected readonly result = toSignal(
    toObservable(this.criteria).pipe(
      debounceTime(250),
      distinctUntilChanged(
        (a, b) =>
          a.refresh === b.refresh &&
          a.scope === b.scope &&
          a.query === b.query &&
          a.format === b.format &&
          a.ruleset === b.ruleset,
      ),
      switchMap(({ scope, query, format, ruleset }) =>
        this.tierListService
          .browse({
            scope,
            q: query,
            format: format || undefined,
            ruleset: ruleset || undefined,
          })
          .pipe(
            catchError(() => {
              this.toasts.error('Could not load tier lists.');
              return of({ tierLists: [], total: 0, limit: 0, skip: 0 });
            }),
          ),
      ),
    ),
    { initialValue: null },
  );

  protected setScope(scope: Scope): void {
    this.scope.set(scope);
  }

  protected get hasFilters(): boolean {
    return !!this.query() || !!this.format() || !!this.ruleset();
  }

  protected clearFilters(): void {
    this.query.set('');
    this.format.set('');
    this.ruleset.set('');
  }

  protected async deleteList(list: TierListSummary): Promise<void> {
    const confirmed = await this.dialog.confirm(`Delete "${list.name}"?`, {
      message:
        'This cannot be undone. A tier list in use by a tournament cannot be deleted.',
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.deleting.set(list.slug);
    this.tierListService.remove(list.slug).subscribe({
      next: () => {
        this.deleting.set(null);
        this.toasts.success(`Deleted "${list.name}".`);
        this.refresh.update((value) => value + 1);
      },
      error: (err) => {
        this.deleting.set(null);
        this.toasts.error(
          err?.error?.details?.reason ??
            err?.error?.message ??
            'Could not delete that tier list.',
        );
      },
    });
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
        this.toasts.error(
          err?.error?.message ?? 'Could not copy that tier list.',
        );
      },
    });
  }
}
