import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { RouterLink } from '@angular/router';
import { LeagueZoneService } from '../league-zone.service';
import { RiskBannerComponent } from './risk-banner.component';
import { SaveBarComponent } from './save-bar.component';
import { SettingsNodeComponent } from './settings-node.component';
import {
  AnyNode,
  POOL_NODES,
  nodeVisible,
  nodesForSection,
  sectionById,
  sectionRisk,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

const HIDDEN_WHEN_COLLAPSED = new Set(['pool.name']);

@Component({
  selector: 'pdz-draft-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    LoadingComponent,
    CardComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    RiskBannerComponent,
    SaveBarComponent,
    SettingsNodeComponent,
    TabNavComponent,
    TabNavLinkComponent,
  ],
  templateUrl: './draft-settings-page.component.html',
  styleUrl: './draft-settings-page.component.scss',
})
export class DraftSettingsPageComponent {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly dialog = inject(DialogService);
  private readonly league = inject(LeagueZoneService);

  protected readonly section = sectionById('draft');

  protected readonly risk = computed(() =>
    sectionRisk(this.section, this.store.phase()),
  );

  protected readonly rules = computed(() => {
    const value = this.store.draft();
    return nodesForSection('draft').filter((node) =>
      nodeVisible(node as AnyNode, value),
    );
  });

  protected readonly poolNodes = computed(() => {
    const pool = this.store.selectedPool();
    if (!pool) return [];
    const collapsed = this.store.collapsed();
    return POOL_NODES.filter((node) => {
      if (collapsed && HIDDEN_WHEN_COLLAPSED.has(node.id)) return false;
      return nodeVisible(node as AnyNode, pool);
    });
  });

  protected readonly dirty = computed(() =>
    this.store.sectionDirtyCount('draft'),
  );

  protected readonly blocked = computed(() =>
    this.store.sectionHasErrors('draft'),
  );

  protected select(poolId: string): void {
    this.store.selectedPoolId.set(poolId);
  }

  protected addPool(): void {
    this.store.addPool(this.store.nextPoolName()).subscribe();
  }

  protected async removePool(poolId: string): Promise<void> {
    const pool = this.store.pools().find((entry) => entry.id === poolId);
    if (!pool) return;
    const confirmed = await this.dialog.confirm(`Delete ${pool.name}?`, {
      message: pool.teams.length
        ? `Its ${pool.teams.length} ${pool.teams.length === 1 ? 'team goes' : 'teams go'} back to the unassigned list. Their rosters are not deleted.`
        : undefined,
      confirmLabel: 'Delete pool',
      confirmColor: 'danger',
    });
    if (confirmed) this.store.removePool(poolId).subscribe();
  }

  protected draftControlLink(draftSlug: string): string[] {
    const leagueSlug = this.league.leagueSlug();
    const tournamentSlug = this.league.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return [];
    return [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'manage',
      'drafts',
      draftSlug,
      'draft',
    ];
  }

  protected async save(): Promise<void> {
    const risk = this.risk();
    if (risk?.effect === 'block') {
      const confirmed = await this.dialog.confirm('Save draft settings?', {
        message: risk.because,
        confirmLabel: 'Save anyway',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
    }
    this.store.saveSection('draft').subscribe();
  }

  protected revert(): void {
    this.store.revertSection('draft');
  }
}
