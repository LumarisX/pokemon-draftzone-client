import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { getLeagueLogoUrl } from '../league.util';
import { formatMilestoneTime } from '../tournament-milestones';
import {
  OpenSignUpsDialogComponent,
  OpenSignUpsDialogData,
  OpenSignUpsDialogResult,
} from './open-signups-dialog.component';
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_ORDER,
  Lifecycle,
  NextStep,
  draftNotStarted,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

type StepState = 'done' | 'current' | 'upcoming';

interface PhaseStep {
  id: Lifecycle;
  label: string;
  when: string;
  state: StepState;
}

interface TodoLink {
  route: string[];
  fragment?: string;
}

interface TodoItem {
  id: string;
  icon: string;
  label: string;
  detail: string;
  action: string;
  urgent: boolean;
  link: TodoLink | null;
}

function dated(
  value: string | undefined,
  upcoming: string,
  passed: string,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const verb = date.getTime() > Date.now() ? upcoming : passed;
  return `${verb} ${formatMilestoneTime(date)}`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

@Component({
  selector: 'pdz-manage-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './manage-overview.component.html',
  styleUrl: './manage-overview.component.scss',
})
export class ManageOverviewComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  protected readonly logoUrl = computed(() => {
    const logo = this.store.saved().logo;
    return logo ? getLeagueLogoUrl(logo) : undefined;
  });

  protected readonly detail = computed(() => {
    const tierList = this.store.artifacts().tierList;
    const teams = this.store.approved().filter((entry) => !!entry.teamId).length;
    return [
      tierList.format || null,
      tierList.ruleset || null,
      teams ? plural(teams, 'team', 'teams') : null,
    ].filter((part): part is string => !!part);
  });

  protected readonly phases = computed<PhaseStep[]>(() => {
    const value = this.store.saved();
    const phase = this.store.phase();
    const current = LIFECYCLE_ORDER.indexOf(phase);
    const firstDraft = this.store
      .pools()
      .map((pool) => pool.draftStart)
      .filter(Boolean)
      .sort()[0];

    const when: Record<Lifecycle, string> = {
      setup: current > 0 ? 'Done' : 'Now',
      signups:
        value.signUpAccess === 'closed' && !this.store.signUps().length
          ? 'Not open yet'
          : (dated(value.signUpDeadline, 'Close', 'Closed') ?? 'Open'),
      draft: dated(firstDraft, 'Opens', 'Opened') ?? 'Not scheduled',
      season: dated(value.seasonStart, 'Starts', 'Started') ?? 'No start date',
      complete: value.completed
        ? 'Completed'
        : (dated(value.seasonEnd, 'Ends', 'Ended') ?? 'No end date'),
    };

    return LIFECYCLE_ORDER.map((id, index) => ({
      id,
      label: LIFECYCLE_LABELS[id],
      when: when[id],
      state:
        index < current || (id === 'complete' && value.completed)
          ? 'done'
          : index === current
            ? 'current'
            : 'upcoming',
    }));
  });

  private readonly needsYou = computed<TodoItem[]>(() => {
    const items: TodoItem[] = [];

    for (const pool of this.store.pools()) {
      if (draftNotStarted(pool.status) || pool.status === 'COMPLETED') continue;
      const paused = pool.status === 'PAUSED';
      items.push({
        id: `draft-${pool.id}`,
        icon: paused ? 'pause_circle' : 'sports_esports',
        label: paused ? `${pool.name} is paused` : `${pool.name} is drafting`,
        detail: paused
          ? 'No one can pick until you resume it.'
          : 'Skip, undo or pause picks from Draft Control.',
        action: 'Open Draft Control',
        urgent: paused,
        link: { route: ['pools', pool.slug, 'draft'] },
      });
    }

    const reports = this.store.pendingReports();
    if (reports) {
      items.push({
        id: 'reports',
        icon: 'scoreboard',
        label: `${plural(reports, 'report', 'reports')} to review`,
        detail: 'Coaches sent in results that need your approval.',
        action: 'Review Results',
        urgent: true,
        link: { route: ['results'] },
      });
    }

    const trades = this.store.pendingTrades();
    if (trades) {
      items.push({
        id: 'trades',
        icon: 'swap_horiz',
        label: `${plural(trades, 'trade', 'trades')} pending`,
        detail: 'Approve or reject them before they go through.',
        action: 'Review Trades',
        urgent: true,
        link: { route: ['trades'] },
      });
    }

    const pending = this.store.statusCounts().pending;
    if (pending && this.store.phase() !== 'signups') {
      items.push({
        id: 'late-signups',
        icon: 'person_search',
        label: `${plural(pending, 'sign-up', 'sign-ups')} to review`,
        detail: 'Late applicants can join as subs or replace a coach.',
        action: 'Review',
        urgent: false,
        link: { route: ['sign-ups'] },
      });
    }

    return items;
  });

  protected readonly todo = computed<TodoItem[]>(() => [
    ...this.needsYou(),
    ...this.store.nextSteps().map((step) => this.fromStep(step)),
  ]);

  protected readonly allClear = computed(() => {
    const phase = this.store.phase();
    if (phase === 'complete' && this.store.saved().completed)
      return 'This tournament is completed. Its results and placements are locked.';
    if (phase === 'season') return 'The season is running. Results and trades that need you show up here.';
    if (phase === 'draft') return 'Everything is ready for the season.';
    return 'Everything is ready for the draft.';
  });

  private fromStep(step: NextStep): TodoItem {
    const link: TodoLink | null =
      step.target.kind === 'settings'
        ? { route: ['settings'], fragment: step.target.anchor }
        : step.target.kind === 'page'
          ? { route: step.target.path }
          : null;
    return {
      id: step.id,
      icon: step.icon,
      label: step.label,
      detail: step.detail,
      action: step.action,
      urgent: false,
      link,
    };
  }

  protected async openSignUps(): Promise<void> {
    const saved = this.store.saved();
    const result = await this.dialog.open<
      OpenSignUpsDialogComponent,
      OpenSignUpsDialogResult,
      OpenSignUpsDialogData
    >(OpenSignUpsDialogComponent, {
      heading: 'Open Sign-Ups',
      subheading: 'Coaches can apply as soon as you open them.',
      size: 'sm',
      data: { deadline: saved.signUpDeadline, access: saved.signUpAccess },
    }).closed;
    if (!result) return;

    this.store.openSignUps(result.deadline, result.access).subscribe({
      next: () => this.toast.success('Sign-ups are open.'),
      error: () => this.toast.error(this.store.saveError() ?? 'Could not open sign-ups.'),
    });
  }
}
