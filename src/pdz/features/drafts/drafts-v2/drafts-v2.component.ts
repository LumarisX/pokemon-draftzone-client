import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DRAFT_OVERVIEW_PATH, PLANNER_PATH } from '@pdz/core/route-paths';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { DraftsV2Service } from './drafts-v2.service';
import {
  Season,
  SeasonDetail,
  SeasonFilter,
  SeasonStatus,
} from './drafts-v2.model';
import { SeasonCardComponent } from './season-card/season-card.component';
import { SeasonDetailComponent } from './season-detail/season-detail.component';

const GROUP_ORDER: { status: SeasonStatus; label: string }[] = [
  { status: 'active', label: 'In progress' },
  { status: 'upcoming', label: 'Not started' },
  { status: 'archived', label: 'Archived' },
];

@Component({
  selector: 'pdz-drafts-v2',
  imports: [
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    PageComponent,
    SeasonCardComponent,
    SeasonDetailComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonComponent,
  ],
  templateUrl: './drafts-v2.component.html',
  styleUrl: './drafts-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftsV2Component {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seasonService = inject(DraftsV2Service);
  private readonly draftService = inject(DraftService);
  private readonly dialogs = inject(DialogService);

  private readonly cards = viewChildren<ElementRef<HTMLElement>>('seasonCard');
  private readonly detailPane =
    viewChild<ElementRef<HTMLElement>>('detailPane');

  private readonly pending = new Set<string>();

  protected readonly draftPath = DRAFT_OVERVIEW_PATH;
  protected readonly plannerPath = PLANNER_PATH;
  protected readonly skeletonCards = [0, 1, 2, 4];

  protected readonly seasons = signal<Season[] | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly query = signal('');
  protected readonly kind = signal<SeasonFilter>('all');
  protected readonly showArchived = signal(false);

  private readonly details = signal<Record<string, SeasonDetail>>({});

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  constructor() {
    this.loadSeasons();

    effect(() => {
      const season = this.selected();
      if (season) this.ensureDetail(season);
    });
  }

  protected readonly archivedCount = computed(
    () =>
      (this.seasons() ?? []).filter((season) => season.status === 'archived')
        .length,
  );

  protected readonly activeCount = computed(
    () =>
      (this.seasons() ?? []).filter((season) => season.status === 'active')
        .length,
  );

  protected readonly lifetime = computed(() =>
    (this.seasons() ?? []).reduce(
      (total, season) => ({
        wins: total.wins + season.record.wins,
        losses: total.losses + season.record.losses,
      }),
      { wins: 0, losses: 0 },
    ),
  );

  private readonly matching = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const kind = this.kind();
    const archived = this.showArchived();

    return (this.seasons() ?? []).filter((season) => {
      if (kind !== 'all' && season.kind !== kind) return false;
      if (season.status === 'archived' && !archived) return false;
      if (!needle) return true;
      return [
        season.name,
        season.leagueName ?? '',
        season.teamName,
        season.format,
        season.ruleset,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  });

  protected readonly groups = computed(() =>
    GROUP_ORDER.map((group) => ({
      ...group,
      seasons: this.matching().filter(
        (season) => season.status === group.status,
      ),
    })).filter((group) => group.seasons.length > 0),
  );

  protected readonly visible = computed(() =>
    this.groups().flatMap((group) => group.seasons),
  );

  protected readonly selectedId = computed(() => {
    const list = this.visible();
    const requested = this.params().get('season');
    if (requested && list.some((season) => season.id === requested)) {
      return requested;
    }
    return list[0]?.id ?? null;
  });

  protected readonly selected = computed(
    () =>
      this.visible().find((season) => season.id === this.selectedId()) ?? null,
  );

  protected readonly selection = computed(() => {
    const season = this.selected();
    return season ? [season] : [];
  });

  protected readonly selectedDetail = computed(() => {
    const id = this.selectedId();
    return id ? (this.details()[id] ?? null) : null;
  });

  protected onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected setKind(kind: SeasonFilter | undefined) {
    this.kind.set(kind ?? 'all');
  }

  protected select(season: Season, reveal = false) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { season: season.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (reveal) this.revealDetail();
  }

  protected toggleArchived() {
    this.showArchived.update((value) => !value);
  }

  protected onRailKeydown(event: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[
      event.key
    ];
    const list = this.visible();
    if (!list.length) return;

    let index: number;
    if (step !== undefined) {
      const current = list.findIndex(
        (season) => season.id === this.selectedId(),
      );
      index = (current + step + list.length) % list.length;
    } else if (event.key === 'Home') {
      index = 0;
    } else if (event.key === 'End') {
      index = list.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    this.select(list[index]);
    this.cards()[index]?.nativeElement.focus();
  }

  protected async archive(season: Season) {
    if (season.source.type !== 'draft') return;

    const confirmed = await this.dialogs.confirm('Archive draft', {
      message: `${season.name} will be archived. This can be undone.`,
      confirmLabel: 'Archive',
    });
    if (!confirmed) return;

    this.draftService.archiveDraft(season.source.slug).subscribe({
      next: () => {
        this.showArchived.set(true);
        this.loadSeasons();
      },
      error: (error) => console.error('Failed to archive draft', error),
    });
  }

  protected restore(season: Season) {
    if (season.source.type !== 'archive' || !season.source.slug) return;

    this.draftService.unarchiveDraft(season.source.slug).subscribe({
      next: () => this.loadSeasons(),
      error: (error) => console.error('Failed to restore draft', error),
    });
  }

  protected async remove(season: Season) {
    if (season.source.type !== 'draft') return;

    const confirmed = await this.dialogs.confirm('Delete draft', {
      message: `Delete ${season.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.draftService.deleteDraft(season.source.slug).subscribe({
      next: () => this.loadSeasons(),
      error: (error) => console.error('Failed to delete draft', error),
    });
  }

  protected refreshDetail(season: Season) {
    this.details.update((cache) => {
      const next = { ...cache };
      delete next[season.id];
      return next;
    });
    this.pending.delete(season.id);
    this.ensureDetail(season);
  }

  protected loadSeasons() {
    this.seasons.set(null);
    this.loadFailed.set(false);
    this.details.set({});
    this.pending.clear();

    this.seasonService.loadSeasons().subscribe({
      next: ({ seasons, failed }) => {
        this.seasons.set(seasons);
        this.loadFailed.set(failed);
      },
      error: (error) => {
        console.error('Failed to load drafts', error);
        this.seasons.set([]);
        this.loadFailed.set(true);
      },
    });
  }

  private ensureDetail(season: Season) {
    if (this.details()[season.id] || this.pending.has(season.id)) return;

    this.pending.add(season.id);
    this.seasonService.loadDetail(season).subscribe({
      next: (detail) => {
        this.pending.delete(season.id);
        this.details.update((cache) => ({ ...cache, [season.id]: detail }));
      },
      error: (error) => {
        console.error('Failed to load season detail', error);
        this.pending.delete(season.id);
        this.details.update((cache) => ({
          ...cache,
          [season.id]: {
            matches: [],
            leaders: [],
            hasSchedule: false,
            failed: true,
          },
        }));
      },
    });
  }

  private revealDetail() {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 63.99rem)').matches) return;
    this.detailPane()?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
