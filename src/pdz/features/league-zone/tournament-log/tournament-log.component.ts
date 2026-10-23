import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { toApiError } from '@pdz/core/services/api-error';
import { TierListChangesComponent } from '@pdz/features/tier-lists/tier-list-changes/tier-list-changes.component';
import { TierListChange } from '@pdz/features/tier-lists/tier-list.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  SettingChange,
  TournamentLogEntry,
  TournamentLogService,
  TournamentLogType,
} from './tournament-log.service';

type Filter = 'all' | 'tier-list' | 'settings';

const FILTER_TYPES: Record<Filter, TournamentLogType[]> = {
  all: [],
  'tier-list': [
    'tier-list.attached',
    'tier-list.swapped',
    'tier-list.edited',
    'tier-list.pulled',
    'tier-list.reverted',
  ],
  settings: ['settings.unlocked', 'settings.changed'],
};

const TYPE_LABEL: Record<TournamentLogType, string> = {
  'tier-list.attached': 'Tier List Attached',
  'tier-list.swapped': 'Tier List Replaced',
  'tier-list.edited': 'Tier List Edited',
  'tier-list.pulled': 'Tier List Updated',
  'tier-list.reverted': 'Tier List Restored',
  'settings.unlocked': 'Unlocked',
  'settings.changed': 'Settings Changed',
};

const TYPE_TONE: Record<TournamentLogType, ChipTone> = {
  'tier-list.attached': 'neutral',
  'tier-list.swapped': 'warning',
  'tier-list.edited': 'info',
  'tier-list.pulled': 'info',
  'tier-list.reverted': 'info',
  'settings.unlocked': 'warning',
  'settings.changed': 'neutral',
};

function describe(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  if (Array.isArray(value)) {
    if (!value.length) return 'None';
    return value
      .map((entry) =>
        entry && typeof entry === 'object' && 'tier' in entry
          ? `${(entry as { tier: string }).tier}: ${(entry as { required: number }).required}${
              (entry as { max: number | null }).max !== null
                ? ` (max ${(entry as { max: number }).max})`
                : ''
            }`
          : describe(entry),
      )
      .join(', ');
  }
  if (typeof value === 'object')
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key} ${describe(entry)}`)
      .join(', ');
  return String(value);
}

@Component({
  selector: 'pdz-tournament-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    ChipComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonLayoutComponent,
    TierListChangesComponent,
  ],
  templateUrl: './tournament-log.component.html',
  styleUrl: './tournament-log.component.scss',
})
export class TournamentLogComponent implements OnInit {
  private readonly logService = inject(TournamentLogService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly typeLabel = TYPE_LABEL;
  protected readonly typeTone = TYPE_TONE;
  protected readonly describe = describe;

  protected readonly filter = signal<Filter>('all');
  protected readonly entries = signal<TournamentLogEntry[] | null>(null);
  protected readonly next = signal<number | null>(null);
  protected readonly state = signal<'ok' | 'hidden' | 'error'>('ok');
  protected readonly loadingMore = signal(false);
  protected readonly expanded = signal<number | null>(null);
  protected readonly visibility = signal<'participants' | 'public'>('participants');

  ngOnInit(): void {
    this.load();
  }

  protected setFilter(filter: Filter): void {
    this.filter.set(filter);
    this.load();
  }

  protected load(): void {
    this.state.set('ok');
    this.entries.set(null);
    this.logService
      .list({ types: FILTER_TYPES[this.filter()] })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.entries.set(page.entries);
          this.next.set(page.next);
          this.visibility.set(page.visibility);
        },
        error: (err) =>
          this.state.set(toApiError(err)?.status === 403 ? 'hidden' : 'error'),
      });
  }

  protected loadMore(): void {
    const before = this.next();
    if (before === null) return;
    this.loadingMore.set(true);
    this.logService.list({ types: FILTER_TYPES[this.filter()], before }).subscribe({
      next: (page) => {
        this.loadingMore.set(false);
        this.entries.update((entries) => [...(entries ?? []), ...page.entries]);
        this.next.set(page.next);
      },
      error: () => {
        this.loadingMore.set(false);
        this.toasts.error('Older entries did not load.');
      },
    });
  }

  protected toggle(entry: TournamentLogEntry): void {
    this.expanded.set(this.expanded() === entry.seq ? null : entry.seq);
  }

  protected hasDetails(entry: TournamentLogEntry): boolean {
    const details = entry.details;
    return !!(
      details?.changes?.length ||
      details?.affectedPicks?.length ||
      details?.requirementsCleared?.length
    );
  }

  protected tierChanges(entry: TournamentLogEntry): TierListChange[] {
    return entry.type.startsWith('tier-list')
      ? ((entry.details?.changes ?? []) as TierListChange[])
      : [];
  }

  protected settingChanges(entry: TournamentLogEntry): SettingChange[] {
    return entry.type === 'settings.changed'
      ? ((entry.details?.changes ?? []) as SettingChange[])
      : [];
  }

  protected tierListLink(entry: TournamentLogEntry): string[] | null {
    if (!entry.target?.id || entry.target.kind !== 'tier-list') return null;
    return ['/', TIER_LIST_PATH, entry.target.id];
  }
}
