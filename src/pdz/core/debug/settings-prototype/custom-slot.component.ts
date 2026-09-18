import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { ControlSpec, PrizeShare, TierRule } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

const MOCK_FORMATS = [
  'Champions M-B',
  'Champions M-A',
  'VGC 2026 Reg H',
  'Gen 9 NatDex',
];

const MOCK_RULESETS = [
  'Champions Reg M-B',
  'Champions Reg M-A',
  'Gen 9 NatDex',
  'ZA NatDex',
];

const MOCK_TIER_COSTS: Record<string, string> = {
  'A Tier': '20–24 pts',
  'B Tier': '14–19 pts',
  'C Tier': '8–13 pts',
  'D Tier': '1–7 pts',
};

@Component({
  selector: 'pdz-custom-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
  ],
  templateUrl: './custom-slot.component.html',
  styleUrl: './custom-slot.component.scss',
})
export class CustomSlotComponent {
  readonly control = input.required<ControlSpec>();
  readonly disabled = input(false);

  private readonly store = inject(SettingsWorkbenchStore);

  protected readonly formats = MOCK_FORMATS;
  protected readonly rulesets = MOCK_RULESETS;

  protected readonly slot = computed(() => {
    const control = this.control();
    return control.kind === 'custom' ? control.slot : null;
  });

  protected readonly format = computed(() => this.store.read<string>('format'));
  protected readonly ruleset = computed(() =>
    this.store.read<string>('ruleset'),
  );
  protected readonly logo = computed(() => this.store.read<string | null>('logo'));
  protected readonly channelId = computed(() =>
    this.store.read<string>('discordSignUpChannelId'),
  );

  protected readonly tierRules = computed(() =>
    this.store.read<TierRule[]>('tierRules'),
  );

  protected readonly rosterMax = computed(() =>
    this.store.read<number>('draftCountMax'),
  );

  protected readonly requiredTotal = computed(() =>
    this.tierRules().reduce((sum, tier) => sum + tier.required, 0),
  );

  protected readonly prizeSplit = computed(() =>
    this.store.read<PrizeShare[]>('prizeSplit'),
  );

  protected readonly prizeTotal = computed(() =>
    this.prizeSplit().reduce((sum, share) => sum + share.percent, 0),
  );

  protected cost(tierName: string): string {
    return MOCK_TIER_COSTS[tierName] ?? '—';
  }

  protected setFormat(value: string): void {
    this.store.write('format', value);
  }

  protected setRuleset(value: string): void {
    this.store.write('ruleset', value);
  }

  protected setChannel(value: string): void {
    this.store.write('discordSignUpChannelId', value);
  }

  protected setRequired(index: number, value: number): void {
    this.updateTier(index, { required: Math.max(0, Number(value) || 0) });
  }

  protected setMax(index: number, value: string): void {
    const parsed = value === '' ? null : Math.max(0, Number(value) || 0);
    this.updateTier(index, { max: parsed });
  }

  private updateTier(index: number, patch: Partial<TierRule>): void {
    this.store.write(
      'tierRules',
      this.tierRules().map((tier, position) =>
        position === index ? { ...tier, ...patch } : tier,
      ),
    );
  }

  protected setPercent(index: number, value: number): void {
    this.store.write(
      'prizeSplit',
      this.prizeSplit().map((share, position) =>
        position === index
          ? { ...share, percent: Math.max(0, Number(value) || 0) }
          : share,
      ),
    );
  }

  protected addShare(): void {
    const current = this.prizeSplit();
    this.store.write('prizeSplit', [
      ...current,
      { place: current.length + 1, percent: 0 },
    ]);
  }

  protected removeShare(index: number): void {
    this.store.write(
      'prizeSplit',
      this.prizeSplit()
        .filter((_, position) => position !== index)
        .map((share, position) => ({ ...share, place: position + 1 })),
    );
  }
}
