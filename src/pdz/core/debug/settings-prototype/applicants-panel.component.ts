import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { FormsModule } from '@angular/forms';
import {
  SIGNUP_STATUSES,
  SIGNUP_STATUS_LABELS,
  SignUpStatus,
  SignUpValue,
} from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

type Filter = 'all' | SignUpStatus;

const FILTERS: readonly Filter[] = ['all', ...SIGNUP_STATUSES];

@Component({
  selector: 'pdz-applicants-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    DisclosureComponent,
    IconComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './applicants-panel.component.html',
  styleUrl: './applicants-panel.component.scss',
})
export class ApplicantsPanelComponent {
  protected readonly store = inject(SettingsWorkbenchStore);

  protected readonly statuses = SIGNUP_STATUSES;
  protected readonly statusLabels = SIGNUP_STATUS_LABELS;
  protected readonly filters = FILTERS;

  protected readonly filter = signal<Filter>('all');
  protected readonly selected = signal<ReadonlySet<string>>(new Set());

  protected readonly visible = computed(() => {
    const filter = this.filter();
    const entries = this.store.signUps();
    return filter === 'all'
      ? entries
      : entries.filter((entry) => entry.status === filter);
  });

  protected readonly selectedIds = computed(() => [...this.selected()]);

  protected readonly allVisibleSelected = computed(() => {
    const visible = this.visible();
    if (!visible.length) return false;
    const selected = this.selected();
    return visible.every((entry) => selected.has(entry.id));
  });

  protected filterLabel(filter: Filter): string {
    if (filter === 'all') return `All ${this.store.signUps().length}`;
    return `${this.statusLabels[filter]} ${this.store.statusCounts()[filter]}`;
  }

  protected isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  protected toggle(id: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleAllVisible(): void {
    const visible = this.visible().map((entry) => entry.id);
    this.selected.update((current) => {
      const next = new Set(current);
      const selectAll = !visible.every((id) => next.has(id));
      for (const id of visible) {
        if (selectAll) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  protected setStatus(id: string, status: SignUpStatus): void {
    this.store.setSignUpStatus(id, status);
  }

  protected bulk(status: SignUpStatus): void {
    this.store.setStatusForAll(this.selectedIds(), status);
    this.selected.set(new Set());
  }

  protected readiness(entry: SignUpValue): string[] {
    const issues: string[] = [];
    if (!entry.inDiscordServer) issues.push('Not in the Discord server');
    if (entry.status === 'approved' && !entry.hasDiscordRole) {
      issues.push('Missing the coach role');
    }
    return issues;
  }
}
