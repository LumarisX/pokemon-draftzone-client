import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PLANNER_PATH } from '@pdz/core/route-paths';
import { DRAFT_AREA, draftLinks } from '@pdz/features/drafts/draft-area';
import { DraftMatchActionsService } from '@pdz/features/drafts/draft-overview/draft-match-actions.service';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft } from '@pdz/features/drafts/draft.model';
import { TeamSeasonComponent } from '@pdz/features/league-zone/league-team/team-season/team-season.component';
import { LSDraftData } from '@pdz/features/planner/planner.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { combineLatest, map, switchMap } from 'rxjs';
import { TeamRosterComponent } from '@pdz/shared/data/team-roster/team-roster.component';
import { loadSeason, SeasonMatch } from '@pdz/features/drafts/draft-season';

@Component({
  selector: 'pdz-opponent-preview',
  templateUrl: './opponent-preview.component.html',
  styleUrl: './opponent-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    PageComponent,
    PageHeaderComponent,
    RecordComponent,
    SkeletonLayoutComponent,
    TeamRosterComponent,
    TeamSeasonComponent,
    TooltipDirective,
  ],
})
export class OpponentTeamPreviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly drafts = inject(DraftService);
  private readonly matchActions = inject(DraftMatchActionsService);
  private readonly dialogs = inject(DialogService);
  private readonly toasts = inject(ToastService);

  private readonly area = inject(DRAFT_AREA);
  protected readonly backLink = this.area.home;
  protected readonly plannerPath = PLANNER_PATH;
  private readonly refresh = signal(0);
  protected readonly busy = signal(false);

  protected readonly teamId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('teamId') ?? '')),
    { initialValue: '' },
  );

  private readonly load = toSignal(
    combineLatest([this.route.paramMap, toObservable(this.refresh)]).pipe(
      switchMap(([params]) =>
        loadSeason(this.drafts, params.get('teamId') ?? '', this.area),
      ),
    ),
  );

  protected readonly season = computed(() => {
    const load = this.load();
    return load?.state === 'ready' ? load.season : null;
  });

  protected readonly failed = computed(() => this.load()?.state === 'failed');

  protected readonly links = computed(() =>
    draftLinks(this.teamId(), this.area),
  );

  protected matchFor(id: string): SeasonMatch | undefined {
    return this.season()?.matches.find((match) => match.id === id);
  }

  protected nextStage(count: number): string {
    return `Week ${count + 1}`;
  }

  protected draftParam(slug: string): string {
    return JSON.stringify(slug);
  }

  protected plannerParam(draft: Draft): string {
    const plannerData: Partial<LSDraftData> = {
      team: draft.team.map((pokemon) => ({
        id: pokemon.id,
        locked: true,
        value: null,
        tier: '',
      })),
      format: draft.format,
      ruleset: draft.ruleset,
      draftName: draft.leagueName,
    };
    return JSON.stringify(plannerData);
  }

  protected openReplays(match: SeasonMatch): void {
    match.replays.forEach((replay) => window.open(replay, '_blank'));
  }

  private ref(match: SeasonMatch) {
    return {
      id: match.id,
      stage: match.stage,
      opponentName: match.opponent.teamName,
      scheduledDate: match.opponent.scheduledDate,
      opponentTimezone: match.opponent.opponentTimezone,
    };
  }

  private reload(): void {
    this.refresh.update((count) => count + 1);
  }

  protected async setMatchTime(match: SeasonMatch): Promise<void> {
    const saved = await this.matchActions.setMatchTime(
      this.teamId(),
      this.ref(match),
    );
    if (saved) this.reload();
  }

  protected async removeMatch(match: SeasonMatch): Promise<void> {
    const deleted = await this.matchActions.remove(
      this.teamId(),
      this.ref(match),
    );
    if (deleted) this.reload();
  }

  protected async toggleCompleted(draft: Draft): Promise<void> {
    if (!draft.completedAt) {
      const confirmed = await this.dialogs.confirm('Mark season completed?', {
        message: `${draft.leagueName} moves to Completed on My Leagues with its final record. You can reopen it any time.`,
        confirmLabel: 'Mark Completed',
      });
      if (!confirmed) return;
    }
    this.busy.set(true);
    const request = draft.completedAt
      ? this.drafts.reopenDraft(draft.slug)
      : this.drafts.completeDraft(draft.slug);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.reload();
      },
      error: () => {
        this.busy.set(false);
        this.toasts.error(
          draft.completedAt
            ? 'Could not reopen this season.'
            : 'Could not mark this season completed.',
        );
      },
    });
  }

  protected async deleteDraft(draft: Draft): Promise<void> {
    const confirmed = await this.dialogs.confirm('Delete draft', {
      message: `Delete ${draft.leagueName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.drafts.deleteDraft(draft.slug).subscribe({
      next: () => this.router.navigate(this.backLink),
      error: () => this.toasts.error('Could not delete that draft.'),
    });
  }
}
