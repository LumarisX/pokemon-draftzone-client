import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DRAFT_OVERVIEW_PATH, PLANNER_PATH } from '@pdz/core/route-paths';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { getLogoUrl } from '@pdz/features/league-zone/league.util';
import { LSDraftData } from '@pdz/features/planner/planner.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TabComponent } from '@pdz/shared/layout/tabs/tab.component';
import { TabsComponent } from '@pdz/shared/layout/tabs/tabs.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import {
  MatchTimeDialogComponent,
  MatchTimeDialogData,
  MatchTimeDialogResult,
} from '@pdz/shared/time/match-time-dialog/match-time-dialog.component';
import { MatchRowComponent } from '../match-row/match-row.component';
import {
  Season,
  SeasonDetail,
  SeasonMatch,
  nextMatch,
  seasonPlayed,
} from '../drafts-v2.model';

const STATUS_LABEL: Record<Season['status'], string> = {
  active: 'In progress',
  upcoming: 'Not started',
  archived: 'Archived',
};

const STATUS_TONE: Record<Season['status'], ChipTone> = {
  active: 'primary',
  upcoming: 'info',
  archived: 'neutral',
};

@Component({
  selector: 'pdz-season-detail',
  imports: [
    RouterLink,
    ButtonComponent,
    ChipComponent,
    CountdownComponent,
    EmptyStateComponent,
    IconComponent,
    MatchRowComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SkeletonComponent,
    SpriteComponent,
    TabComponent,
    TabsComponent,
  ],
  templateUrl: './season-detail.component.html',
  styleUrl: './season-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'dz-detail' },
})
export class SeasonDetailComponent {
  private readonly draftService = inject(DraftService);
  private readonly dialogs = inject(DialogService);

  readonly season = input.required<Season>();
  readonly detail = input<SeasonDetail | null>(null);

  readonly archiveRequested = output<Season>();
  readonly restoreRequested = output<Season>();
  readonly deleteRequested = output<Season>();
  readonly changed = output<Season>();

  protected readonly draftPath = DRAFT_OVERVIEW_PATH;
  protected readonly plannerPath = PLANNER_PATH;

  protected readonly skeletonRows = [0, 1, 2];

  protected readonly statusLabel = computed(
    () => STATUS_LABEL[this.season().status],
  );
  protected readonly statusTone = computed(
    () => STATUS_TONE[this.season().status],
  );

  protected readonly eyebrow = computed(() => {
    const season = this.season();
    if (season.leagueName) return season.leagueName;
    return season.status === 'archived' ? 'Archived draft' : 'Personal draft';
  });

  protected readonly kindLabel = computed(() =>
    this.season().kind === 'tournament'
      ? 'Hosted tournament'
      : 'Personal draft',
  );

  protected readonly logoUrl = computed(() => {
    const logo = this.season().logo;
    return logo ? getLogoUrl(logo) : null;
  });

  protected readonly crest = computed(() =>
    this.season()
      .teamName.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join(''),
  );

  protected readonly played = computed(() => seasonPlayed(this.season()));

  protected readonly winRateLabel = computed(() => {
    const played = this.played();
    if (!played) return '—';
    return `${Math.round((this.season().record.wins / played) * 100)}%`;
  });

  protected readonly matches = computed(() => this.detail()?.matches ?? []);

  protected readonly upNext = computed(() => nextMatch(this.matches()));

  protected readonly upcoming = computed(() =>
    this.matches()
      .filter((match) => !match.score)
      .sort((a, b) => this.time(a.scheduledDate) - this.time(b.scheduledDate)),
  );

  protected readonly results = computed(() =>
    this.matches()
      .filter((match) => !!match.score)
      .sort((a, b) => this.time(b.scheduledDate) - this.time(a.scheduledDate)),
  );

  protected readonly leaders = computed(() => this.detail()?.leaders ?? []);

  protected readonly maxKills = computed(() =>
    Math.max(1, ...this.leaders().map((leader) => leader.kills)),
  );

  protected readonly editParams = computed(() => {
    const source = this.season().source;
    return source.type === 'draft'
      ? { draft: JSON.stringify(source.slug) }
      : null;
  });

  protected readonly plannerParams = computed(() => {
    const season = this.season();
    const payload: Partial<LSDraftData> = {
      team: season.roster.map((pokemon) => ({
        id: pokemon.id,
        locked: true,
        value: null,
        tier: '',
      })),
      format: season.format,
      ruleset: season.ruleset,
      draftName: season.name,
    };
    return { draft: JSON.stringify(payload) };
  });

  protected readonly statsLink = computed(() => {
    const source = this.season().source;
    if (source.type === 'draft') {
      return ['/', DRAFT_OVERVIEW_PATH, source.slug, 'stats'];
    }
    if (source.type === 'archive') {
      return ['/', DRAFT_OVERVIEW_PATH, 'archives', source.archiveId, 'stats'];
    }
    return null;
  });

  protected readonly addOpponentLink = computed(() => {
    const source = this.season().source;
    return source.type === 'draft'
      ? ['/', DRAFT_OVERVIEW_PATH, source.slug, 'form']
      : null;
  });

  protected readonly addOpponentParams = computed(() => ({
    stage: `Week ${this.matches().length + 1}`,
  }));

  protected readonly canRestore = computed(() => {
    const source = this.season().source;
    return source.type === 'archive' && !!source.slug;
  });

  async setMatchTime(match: SeasonMatch) {
    const source = this.season().source;
    if (source.type !== 'draft') return;

    const result = await this.dialogs.open<
      MatchTimeDialogComponent,
      MatchTimeDialogResult,
      MatchTimeDialogData
    >(MatchTimeDialogComponent, {
      heading: match.scheduledDate ? 'Edit Match Time' : 'Set Match Time',
      subheading: `${match.stage} vs ${match.teamName}`,
      size: 'lg',
      data: {
        opponentName: match.teamName,
        scheduledDate: match.scheduledDate,
        opponentTimezone: match.opponentTimezone,
      },
    }).closed;

    if (!result) return;

    this.draftService
      .updateMatchupSchedule(match.id, source.slug, result)
      .subscribe({
        next: () => this.changed.emit(this.season()),
        error: (error) => console.error('Failed to save match time', error),
      });
  }

  async deleteMatch(match: SeasonMatch) {
    const source = this.season().source;
    if (source.type !== 'draft') return;

    const confirmed = await this.dialogs.confirm('Delete matchup', {
      message: `Delete ${match.stage} vs ${match.teamName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.draftService.deleteMatchup(match.id, source.slug).subscribe({
      next: () => this.changed.emit(this.season()),
      error: (error) => console.error('Failed to delete matchup', error),
    });
  }

  private time(value?: string | null) {
    return value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER;
  }
}
