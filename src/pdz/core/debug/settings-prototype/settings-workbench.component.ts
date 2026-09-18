import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LaunchChecklistComponent } from './launch-checklist.component';
import { SettingsNodeComponent } from './settings-node.component';
import {
  LIFECYCLE_ORDER,
  Lifecycle,
  RiskSpec,
  SETTINGS_SECTIONS,
  SettingsNode,
  SettingsSection,
  SettingsSectionId,
  sectionRisk,
} from './settings-schema';
import {
  BLANK_ARTIFACTS,
  BLANK_SETTINGS,
  MOCK_ARTIFACTS,
  MOCK_SETTINGS,
  SettingsWorkbenchStore,
} from './settings-workbench.store';

type SectionView = Omit<SettingsSection, 'risk'> & {
  nodes: SettingsNode[];
  risk: RiskSpec | null;
  locked: boolean;
};

const PHASE_LABELS: Record<Lifecycle, string> = {
  setup: 'Setup',
  signups: 'Sign-ups',
  draft: 'Drafting',
  season: 'Season',
  complete: 'Complete',
};

@Component({
  selector: 'pdz-settings-workbench',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsWorkbenchStore],
  imports: [
    FormsModule,
    ButtonComponent,
    CardComponent,
    IconComponent,
    InputDirective,
    LaunchChecklistComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SettingsNodeComponent,
  ],
  templateUrl: './settings-workbench.component.html',
  styleUrl: './settings-workbench.component.scss',
})
export class SettingsWorkbenchComponent {
  protected readonly store = inject(SettingsWorkbenchStore);
  private readonly dialog = inject(DialogService);

  protected readonly phases = LIFECYCLE_ORDER;
  protected readonly phaseLabels = PHASE_LABELS;

  private readonly unlocked = linkedSignal<Lifecycle, Set<SettingsSectionId>>({
    source: () => this.store.phase(),
    computation: () => new Set<SettingsSectionId>(),
  });

  protected readonly sections = computed<SectionView[]>(() => {
    const visible = this.store.visibleNodes();
    const phase = this.store.phase();
    const unlocked = this.unlocked();

    return SETTINGS_SECTIONS.map((section) => {
      const risk = sectionRisk(section, phase);
      return {
        ...section,
        nodes: visible.filter((node) => node.section === section.id),
        risk,
        locked: !!risk && !unlocked.has(section.id),
      };
    }).filter((section) => section.nodes.length > 0);
  });

  protected dirtyCount(section: SettingsSectionId): number {
    return this.store.sectionDirtyKeys(section).length;
  }

  protected async toggleLock(section: SectionView): Promise<void> {
    if (!section.locked) {
      this.unlocked.update((current) => {
        const next = new Set(current);
        next.delete(section.id);
        return next;
      });
      return;
    }

    const confirmed = await this.dialog.confirm(`Unlock ${section.label}?`, {
      message: section.risk?.because,
      confirmLabel: 'Unlock',
      confirmColor: section.risk?.effect === 'block' ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    this.unlocked.update((current) => new Set(current).add(section.id));
  }

  protected seedFilled(): void {
    this.store.reset(MOCK_SETTINGS, MOCK_ARTIFACTS);
  }

  protected seedBlank(): void {
    this.store.reset(BLANK_SETTINGS, BLANK_ARTIFACTS);
  }
}
