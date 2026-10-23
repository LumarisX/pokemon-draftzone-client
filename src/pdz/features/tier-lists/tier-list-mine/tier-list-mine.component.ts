import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import {
  StartTournamentData,
  StartTournamentDialogComponent,
} from '../start-tournament-dialog/start-tournament-dialog.component';
import { TierListCardComponent } from '../tier-list-card/tier-list-card.component';
import { TierListService, TierListSummary } from '../tier-list.service';

const LIMIT = 50;

@Component({
  selector: 'pdz-tier-list-mine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
    TierListCardComponent,
  ],
  templateUrl: './tier-list-mine.component.html',
  styleUrl: './tier-list-mine.component.scss',
})
export class TierListMineComponent implements OnInit {
  private readonly tierListService = inject(TierListService);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly path = TIER_LIST_PATH;
  protected readonly mine = signal<TierListSummary[] | null>(null);
  protected readonly shared = signal<TierListSummary[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.mine.set(null);
    this.shared.set(null);
    forkJoin({
      mine: this.tierListService.browse({ scope: 'mine', limit: LIMIT }),
      shared: this.tierListService.browse({ scope: 'shared', limit: LIMIT }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ mine, shared }) => {
          this.mine.set(mine.tierLists);
          this.shared.set(shared.tierLists);
        },
        error: () => this.failed.set(true),
      });
  }

  protected duplicate(list: TierListSummary): void {
    this.busy.set(list.slug);
    this.tierListService.fork(list.slug, { name: `${list.name} (copy)` }).subscribe({
      next: (created) => {
        this.busy.set(null);
        this.router.navigate(['/', TIER_LIST_PATH, created.slug, 'edit']);
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not duplicate that tier list.'));
      },
    });
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

  protected async remove(list: TierListSummary): Promise<void> {
    const confirmed = await this.dialogs.confirm(`Delete ${list.name}?`, {
      message:
        "This can't be undone. Tournaments that started from it keep their own copies.",
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.busy.set(list.slug);
    this.tierListService.remove(list.slug).subscribe({
      next: () => {
        this.busy.set(null);
        this.toasts.success(`Deleted ${list.name}.`);
        this.mine.update((lists) => lists?.filter((entry) => entry.id !== list.id) ?? null);
      },
      error: (err) => {
        this.busy.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not delete that tier list.'));
      },
    });
  }
}
