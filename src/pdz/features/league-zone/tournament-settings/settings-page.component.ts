import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GuardsUnsavedChanges } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import {
  PageSection,
  PageSectionsComponent,
} from '@pdz/shared/layout/page-sections/page-sections.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { QuickSetupComponent } from './quick-setup.component';
import { RiskBannerComponent } from './risk-banner.component';
import { SaveBarComponent } from './save-bar.component';
import { SettingsNodeComponent } from './settings-node.component';
import {
  AnyNode,
  POOL_DEFAULTS,
  POOL_NODES,
  PoolNode,
  SETTINGS_SECTIONS,
  SettingsAnchor,
  SettingsNode,
  SettingsSectionId,
  TIER_LIST_GATE_REASON,
  nodeKeys,
  nodeVisible,
  nodesForSection,
  sectionById,
  sectionRisk,
} from './settings-schema';
import {
  EMPTY_SETTINGS,
  TournamentSettingsStore,
} from './tournament-settings.store';

const HIDDEN_WHEN_COLLAPSED = new Set(['pool.name']);
const QUICK_SETUP_SETTINGS = new Set(['diffMode', 'tiebreakers']);
const QUICK_SETUP_POOL = new Set([
  'sequentialTurns',
  'allowDuplicates',
  'pickTimerEnabled',
  'pickTimerMinutes',
]);

type Block =
  | { kind: 'quick' }
  | { kind: 'nodes'; section: SettingsSectionId }
  | { kind: 'pools' }
  | { kind: 'organizers' }
  | { kind: 'completion' };

type NodeEntry = { node: SettingsNode; locked: boolean };

function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

const BLOCKS: readonly Block[] = [
  { kind: 'quick' },
  { kind: 'nodes', section: 'general' },
  { kind: 'nodes', section: 'signup' },
  { kind: 'nodes', section: 'draft' },
  { kind: 'pools' },
  { kind: 'nodes', section: 'season' },
  { kind: 'nodes', section: 'discord' },
  { kind: 'organizers' },
  { kind: 'completion' },
];

@Component({
  selector: 'pdz-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    DisclosureComponent,
    EmptyStateComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    PageSectionsComponent,
    QuickSetupComponent,
    RiskBannerComponent,
    SaveBarComponent,
    SettingsNodeComponent,
    SkeletonLayoutComponent,
    TabNavComponent,
    TabNavLinkComponent,
  ],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements GuardsUnsavedChanges {
  protected readonly store = inject(TournamentSettingsStore);
  private readonly dialog = inject(DialogService);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  protected readonly blocks = BLOCKS;
  protected readonly gateReason = TIER_LIST_GATE_REASON;

  protected readonly sections = computed<PageSection[]>(() =>
    BLOCKS.map((block) => ({
      id: this.anchor(block),
      label: this.label(block),
    })),
  );

  private readonly tierListAttached = computed(
    () => this.store.artifacts().tierList.name !== null,
  );

  private readonly visibleNodes = computed(() => {
    const value = this.store.draft();
    const attached = this.tierListAttached();
    const bySection = new Map<SettingsSectionId, NodeEntry[]>();
    for (const section of SETTINGS_SECTIONS) {
      bySection.set(
        section.id,
        nodesForSection(section.id)
          .filter((node) => nodeVisible(node as AnyNode, value))
          .map((node) => ({
            node,
            locked: node.requiresTierList === true && !attached,
          })),
      );
    }
    return bySection;
  });

  private readonly allPoolNodes = computed(() => {
    const pool = this.store.selectedPool();
    if (!pool) return [];
    const collapsed = this.store.collapsed();
    return POOL_NODES.filter((node) => {
      if (collapsed && HIDDEN_WHEN_COLLAPSED.has(node.id)) return false;
      return nodeVisible(node as AnyNode, pool);
    });
  });

  protected readonly poolNodes = computed(() =>
    this.allPoolNodes().filter((node) => !node.advanced),
  );

  protected readonly poolAdvancedNodes = computed(() =>
    this.allPoolNodes().filter((node) => node.advanced),
  );

  private readonly advancedChoice = signal<
    Partial<Record<SettingsAnchor, boolean>>
  >({});

  private readonly customized = computed(() => {
    const value = this.store.draft() as unknown as Record<string, unknown>;
    const defaults = EMPTY_SETTINGS as unknown as Record<string, unknown>;
    const issues = new Set(this.store.errors().map((issue) => issue.nodeId));
    const anchors = new Set<SettingsAnchor>();
    for (const section of SETTINGS_SECTIONS) {
      const changed = this.advancedNodes(section.id).some(
        ({ node }) =>
          issues.has(node.id) ||
          nodeKeys(node as AnyNode).some((key) =>
            key === 'tiebreakers'
              ? this.store.tiebreakersCustomized()
              : !QUICK_SETUP_SETTINGS.has(key) &&
                differs(value[key], defaults[key]),
          ),
      );
      if (changed) anchors.add(section.id);
    }

    const pool = this.store.selectedPool() as unknown as Record<
      string,
      unknown
    > | null;
    const poolDefaults = POOL_DEFAULTS as Record<string, unknown>;
    if (
      pool &&
      this.poolAdvancedNodes().some(
        (node: PoolNode) =>
          issues.has(node.id) ||
          nodeKeys(node as AnyNode).some(
            (key) =>
              !QUICK_SETUP_POOL.has(key) &&
              key in poolDefaults &&
              differs(pool[key], poolDefaults[key]),
          ),
      )
    )
      anchors.add('pools');
    return anchors;
  });

  protected advancedOpen(anchor: SettingsAnchor): boolean {
    return this.advancedChoice()[anchor] ?? this.customized().has(anchor);
  }

  protected advancedChanged(anchor: SettingsAnchor): boolean {
    return this.customized().has(anchor);
  }

  protected setAdvanced(anchor: SettingsAnchor, open: boolean): void {
    this.advancedChoice.update((choice) => ({ ...choice, [anchor]: open }));
  }

  protected adjust(anchor: string): void {
    this.setAdvanced(anchor as SettingsAnchor, true);
    setTimeout(() =>
      document
        .getElementById(anchor)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    );
  }

  constructor() {
    effect(() => {
      const target = this.fragment();
      if (this.store.loading() || !target) return;
      setTimeout(() =>
        document
          .getElementById(target)
          ?.scrollIntoView({ block: 'start', behavior: 'auto' }),
      );
    });
  }

  protected anchor(block: Block): SettingsAnchor {
    if (block.kind === 'quick') return 'setup';
    return block.kind === 'nodes' ? block.section : block.kind;
  }

  protected label(block: Block): string {
    if (block.kind === 'quick') return 'Quick Setup';
    if (block.kind === 'pools')
      return this.store.collapsed() ? 'Draft Pool' : 'Draft Pools';
    if (block.kind === 'organizers') return 'Organizers';
    if (block.kind === 'completion') return 'Completion';
    return sectionById(block.section).label;
  }

  protected nodes(section: SettingsSectionId): NodeEntry[] {
    return (this.visibleNodes().get(section) ?? []).filter(
      ({ node }) => !node.advanced,
    );
  }

  protected advancedNodes(section: SettingsSectionId): NodeEntry[] {
    return (this.visibleNodes().get(section) ?? []).filter(
      ({ node }) => node.advanced,
    );
  }

  protected risk(section: SettingsSectionId) {
    return sectionRisk(sectionById(section), this.store.phase());
  }

  protected readonly poolRisk = computed(() =>
    sectionRisk(sectionById('draft'), this.store.phase()),
  );

  protected selectPool(poolId: string): void {
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
      confirmLabel: 'Delete Pool',
      confirmColor: 'danger',
    });
    if (confirmed) this.store.removePool(poolId).subscribe();
  }

  protected async save(): Promise<void> {
    const risk = this.store.saveRisk();
    if (risk) {
      const confirmed = await this.dialog.confirm('Save draft settings?', {
        message: risk.because,
        confirmLabel: 'Save Anyway',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
    }
    this.store.saveSettings().subscribe();
  }

  protected revert(): void {
    this.store.revertSettings();
  }

  async canDeactivate(): Promise<boolean> {
    if (!this.store.settingsDirtyCount()) return true;
    const leave = await this.dialog.confirm('Leave without saving?', {
      message: 'Your changes to these settings will be lost.',
      confirmLabel: 'Discard Changes',
      confirmColor: 'danger',
    });
    if (leave) this.store.revertSettings();
    return leave;
  }
}
