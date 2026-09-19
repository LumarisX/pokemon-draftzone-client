import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LaunchChecklistComponent } from './launch-checklist.component';
import {
  LIFECYCLE_ORDER,
  Lifecycle,
  SETTINGS_SECTIONS,
  sectionRisk,
} from './settings-schema';
import {
  BLANK_ARTIFACTS,
  BLANK_POOLS,
  BLANK_SETTINGS,
  BLANK_SIGNUPS,
  MOCK_ARTIFACTS,
  MOCK_POOLS,
  MOCK_SETTINGS,
  MOCK_SIGNUPS,
  SettingsWorkbenchStore,
} from './settings-workbench.store';

const PHASE_LABELS: Record<Lifecycle, string> = {
  setup: 'Setup',
  signups: 'Sign-ups',
  draft: 'Drafting',
  season: 'Season',
  complete: 'Complete',
};

@Component({
  selector: 'pdz-settings-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    IconComponent,
    LaunchChecklistComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './settings-dashboard.component.html',
  styleUrl: './settings-dashboard.component.scss',
})
export class SettingsDashboardComponent {
  protected readonly store = inject(SettingsWorkbenchStore);

  protected readonly phases = LIFECYCLE_ORDER;
  protected readonly phaseLabels = PHASE_LABELS;

  protected readonly sections = computed(() => {
    const phase = this.store.phase();
    return SETTINGS_SECTIONS.map((section) => ({
      ...section,
      risk: sectionRisk(section, phase),
      dirty: this.store.sectionDirtyCount(section.id),
      summary: this.summary(section.id),
    }));
  });

  protected readonly showChecklist = computed(
    () => this.store.phase() === 'setup' || this.store.phase() === 'signups',
  );

  private summary(id: string): string {
    const value = this.store.draft();
    const artifacts = this.store.artifacts();

    switch (id) {
      case 'identity':
        return value.name || 'Unnamed tournament';
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

  protected seedFilled(): void {
    this.store.reset(MOCK_SETTINGS, MOCK_POOLS, MOCK_SIGNUPS, MOCK_ARTIFACTS);
  }

  protected seedBlank(): void {
    this.store.reset(
      BLANK_SETTINGS,
      BLANK_POOLS,
      BLANK_SIGNUPS,
      BLANK_ARTIFACTS,
    );
  }
}
