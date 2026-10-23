import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListChangesComponent } from '../tier-list-changes/tier-list-changes.component';
import { tierListBase } from '../tier-list-links';
import { TierListChange, TierListMeta, TierListRevision } from '../tier-list.model';
import { TierListService } from '../tier-list.service';

const KIND_LABEL: Record<TierListRevision['kind'], string> = {
  create: 'Created',
  edit: 'Edited',
  import: 'Imported',
  revert: 'Restored',
  pull: 'Pulled',
  fork: 'Forked',
  copy: 'Copied',
};

@Component({
  selector: 'pdz-tier-list-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    ChipComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
    TierListChangesComponent,
  ],
  templateUrl: './tier-list-history.component.html',
  styleUrl: './tier-list-history.component.scss',
})
export class TierListHistoryComponent implements OnInit {
  private readonly tierLists = inject(TierListService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogs = inject(DialogService);
  private readonly toasts = inject(ToastService);
  private readonly league = inject(LeagueZoneService);

  protected readonly kindLabel = KIND_LABEL;
  protected readonly slug = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly meta = signal<TierListMeta | null>(null);
  protected readonly revisions = signal<TierListRevision[] | null>(null);
  protected readonly current = signal(0);
  protected readonly next = signal<number | null>(null);
  protected readonly failed = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly expanded = signal<number | null>(null);
  protected readonly changes = signal(new Map<number, TierListChange[]>());
  protected readonly restoring = signal<number | null>(null);

  protected readonly canRestore = computed(() => {
    const access = this.meta()?.access;
    return access === 'edit' || access === 'manage';
  });

  protected readonly backLink = computed(() => tierListBase(this.league, this.slug()));

  protected compareLink(version: number) {
    return { link: [...this.backLink(), 'compare'], query: { rev: version } };
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.revisions.set(null);
    const routed = this.route.snapshot.paramMap.get('tierListSlug');
    const slug$ = routed ? of(routed) : this.tierLists.resolveTierListId();
    slug$.subscribe({
      next: (slug) => {
        this.tierLists.getTierListBySlug(slug).subscribe({
          next: (view) => {
            this.slug.set(view.meta?.slug ?? slug);
            this.name.set(view.name ?? 'Tier List');
            this.meta.set(view.meta ?? null);
            this.fetch();
          },
          error: () => this.failed.set(true),
        });
      },
      error: () => this.failed.set(true),
    });
  }

  private fetch(before?: number): void {
    const slug = this.slug();
    if (!slug) return;
    this.tierLists.revisions(slug, before).subscribe({
      next: (page) => {
        this.loadingMore.set(false);
        this.current.set(page.current);
        this.next.set(page.next);
        this.revisions.update((existing) =>
          before === undefined ? page.revisions : [...(existing ?? []), ...page.revisions],
        );
      },
      error: () => {
        this.loadingMore.set(false);
        if (before === undefined) this.failed.set(true);
        else this.toasts.error('More history did not load.');
      },
    });
  }

  protected loadMore(): void {
    const next = this.next();
    if (next === null) return;
    this.loadingMore.set(true);
    this.fetch(next);
  }

  protected toggle(revision: TierListRevision): void {
    if (this.expanded() === revision.version) {
      this.expanded.set(null);
      return;
    }
    this.expanded.set(revision.version);
    if (this.changes().has(revision.version)) return;
    this.tierLists.revision(this.slug()!, revision.version).subscribe({
      next: (detail) =>
        this.changes.update((map) => new Map(map).set(revision.version, detail.changes)),
      error: () => this.toasts.error('Those changes did not load.'),
    });
  }

  protected async restore(revision: TierListRevision): Promise<void> {
    const confirmed = await this.dialogs.confirm(`Restore version ${revision.version}?`, {
      message:
        'The list goes back to how it was then. This is saved as a new version, so nothing in the history is lost.',
      confirmLabel: 'Restore',
    });
    if (!confirmed) return;
    this.restoring.set(revision.version);
    this.tierLists.revert(this.slug()!, revision.version, this.current()).subscribe({
      next: (result) => {
        this.restoring.set(null);
        this.toasts.success(result.message);
        this.expanded.set(null);
        this.fetch();
      },
      error: (err) => {
        this.restoring.set(null);
        this.toasts.error(apiErrorMessage(err, 'Could not restore that version.'));
      },
    });
  }
}
