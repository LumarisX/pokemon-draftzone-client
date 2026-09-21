import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { getLeagueLogoUrl } from '../league.util';
import {
  manageAccessLink,
  manageDashboardGroups,
} from '../tournaments/tournament-links';
import { LaunchChecklistComponent } from './launch-checklist.component';
import {
  SETTINGS_SECTIONS,
  draftNotStarted,
  sectionRisk,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

interface AttentionItem {
  id: string;
  icon: string;
  label: string;
  route: string[];
  tone: 'urgent' | 'normal';
}

@Component({
  selector: 'pdz-settings-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ChipComponent,
    IconComponent,
    LaunchChecklistComponent,
    LoadingComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './settings-dashboard.component.html',
  styleUrl: './settings-dashboard.component.scss',
})
export class SettingsDashboardComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);

  protected readonly logoUrl = computed(() => {
    const logo = this.store.draft().logo;
    return logo ? getLeagueLogoUrl(logo) : undefined;
  });

  private readonly base = computed(() => {
    const leagueSlug = this.league.leagueSlug();
    const tournamentSlug = this.league.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/leagues', leagueSlug, 'tournaments', tournamentSlug];
  });

  protected readonly sections = computed(() => {
    const phase = this.store.phase();
    return SETTINGS_SECTIONS.map((section) => ({
      id: section.id as string,
      label: section.label,
      icon: section.icon,
      path: [section.path],
      risk: sectionRisk(section, phase),
      dirty: this.store.sectionDirtyCount(section.id),
      summary: this.summary(section.id),
    }));
  });

  protected readonly accessLink = computed(() => manageAccessLink(this.base()));

  private readonly livePools = computed(() =>
    this.store
      .pools()
      .filter(
        (pool) =>
          !draftNotStarted(pool.status) && pool.status !== 'COMPLETED',
      ),
  );

  protected readonly runGroups = computed(() => {
    const groups = manageDashboardGroups(this.base());
    const pools = this.store.pools();
    if (!pools.length || this.livePools().length) return groups;

    const target = pools[0];
    return groups.map((group) =>
      group.id === 'run'
        ? {
            ...group,
            links: [
              ...group.links,
              {
                id: 'draft-control',
                label: 'Draft Control',
                route: [
                  ...this.base(),
                  'manage',
                  'drafts',
                  target.slug,
                  'draft',
                ],
                icon: 'sports_esports',
                description:
                  pools.length === 1
                    ? 'Run the draft, skip and undo picks'
                    : `Run any of ${pools.length} pools`,
              },
            ],
          }
        : group,
    );
  });

  protected readonly coachViewLinks = computed(() =>
    this.store.pools().map((pool) => ({
      name: pool.name,
      route: [...this.base(), 'drafts', pool.slug, 'draft'],
    })),
  );

  protected readonly showChecklist = computed(
    () => this.store.phase() === 'setup' || this.store.phase() === 'signups',
  );

  protected readonly attention = computed<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    const base = this.base();
    if (!base.length) return items;

    const pendingSignUps = this.store.statusCounts().pending;
    if (pendingSignUps) {
      items.push({
        id: 'signups',
        icon: 'how_to_reg',
        label: `${pendingSignUps} sign-up${pendingSignUps === 1 ? '' : 's'} to review`,
        route: [...base, 'manage', 'sign-ups'],
        tone: 'normal',
      });
    }

    for (const pool of this.livePools()) {
      items.push({
        id: `draft-${pool.slug}`,
        icon: 'sports_esports',
        label:
          pool.status === 'PAUSED'
            ? `${pool.name} is paused`
            : `${pool.name} is drafting`,
        route: [...base, 'manage', 'drafts', pool.slug, 'draft'],
        tone: pool.status === 'PAUSED' ? 'urgent' : 'normal',
      });
    }

    const reports = this.store.pendingReports();
    if (reports) {
      items.push({
        id: 'reports',
        icon: 'scoreboard',
        label: `${reports} report${reports === 1 ? '' : 's'} awaiting review`,
        route: [...base, 'manage', 'results'],
        tone: 'urgent',
      });
    }

    const trades = this.store.pendingTrades();
    if (trades) {
      items.push({
        id: 'trades',
        icon: 'swap_horiz',
        label: `${trades} trade${trades === 1 ? '' : 's'} pending`,
        route: [...base, 'manage', 'trades'],
        tone: 'urgent',
      });
    }

    const unassigned = this.store.unassigned().length;
    if (unassigned) {
      items.push({
        id: 'unassigned',
        icon: 'group_add',
        label: `${unassigned} team${unassigned === 1 ? '' : 's'} not in a pool`,
        route: [...base, 'manage', 'draft'],
        tone: 'normal',
      });
    }

    return items;
  });

  protected readonly signUpsOpen = computed(() => {
    const deadline = this.store.draft().signUpDeadline;
    return !!deadline && new Date() <= new Date(deadline);
  });

  private summary(id: string): string {
    const value = this.store.draft();
    const artifacts = this.store.artifacts();

    switch (id) {
      case 'identity':
        return artifacts.rules.sectionCount
          ? `${artifacts.rules.sectionCount} rule sections`
          : 'No rules yet';
      case 'signup': {
        const counts = this.store.statusCounts();
        if (!this.store.signUps().length) return 'No sign-ups yet';
        return counts.pending
          ? `${counts.pending} awaiting review · ${counts.approved} approved`
          : `${counts.approved} approved`;
      }
      case 'draft': {
        const pools = this.store.poolCount();
        const list = artifacts.tierList.name ?? 'no tier list';
        return `${pools} ${pools === 1 ? 'pool' : 'pools'} · ${list}`;
      }
      case 'season':
        return artifacts.schedule.matchupCount
          ? `${artifacts.schedule.stageCount} stages · ${artifacts.schedule.matchupCount} matchups`
          : 'No schedule yet';
      default: {
        const invite = value.discord ? 'Invite set' : 'No invite';
        return `${invite} · ${value.discordGuildId ? 'bot connected' : 'bot not connected'}`;
      }
    }
  }
}
