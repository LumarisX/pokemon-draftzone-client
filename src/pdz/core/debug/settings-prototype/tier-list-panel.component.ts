import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { TierRequirement } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

interface RequirementRow {
  tierId: string;
  name: string;
  cost: number;
  required: number;
  max: number | null;
}

@Component({
  selector: 'pdz-tier-list-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    IconComponent,
    InputDirective,
    RouterLink,
  ],
  templateUrl: './tier-list-panel.component.html',
  styleUrl: './tier-list-panel.component.scss',
})
export class TierListPanelComponent {
  private readonly store = inject(SettingsWorkbenchStore);

  protected readonly tierList = computed(() => this.store.artifacts().tierList);
  protected readonly attached = computed(() => this.tierList().name !== null);

  protected readonly rows = computed<RequirementRow[]>(() => {
    const requirements = this.store.read<TierRequirement[]>('tierRequirements');
    return this.tierList().tiers.map((tier) => {
      const match = requirements.find((entry) => entry.tierId === tier.id);
      return {
        tierId: tier.id,
        name: tier.name,
        cost: tier.cost,
        required: match?.required ?? 0,
        max: match?.max ?? null,
      };
    });
  });

  protected readonly requiredTotal = computed(() =>
    this.rows().reduce((sum, row) => sum + row.required, 0),
  );

  protected readonly rosterMax = computed(() =>
    this.store.read<number>('draftCountMax'),
  );

  protected readonly overBudget = computed(
    () => this.requiredTotal() > this.rosterMax(),
  );

  protected setRequired(tierId: string, value: number): void {
    this.patch(tierId, { required: Math.max(0, Number(value) || 0) });
  }

  protected setMax(tierId: string, value: string): void {
    this.patch(tierId, {
      max: value === '' ? null : Math.max(0, Number(value) || 0),
    });
  }

  private patch(tierId: string, patch: Partial<TierRequirement>): void {
    const current = this.store.read<TierRequirement[]>('tierRequirements');
    const exists = current.some((entry) => entry.tierId === tierId);
    const next = exists
      ? current.map((entry) =>
          entry.tierId === tierId ? { ...entry, ...patch } : entry,
        )
      : [...current, { tierId, required: 0, max: null, ...patch }];
    this.store.write('tierRequirements', next);
  }
}
