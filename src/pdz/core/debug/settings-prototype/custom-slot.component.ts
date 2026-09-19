import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PoolOrderComponent } from './pool-order.component';
import { AnyControlSpec, PrizeShare } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';
import { TierListPanelComponent } from './tier-list-panel.component';

@Component({
  selector: 'pdz-custom-slot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    PoolOrderComponent,
    TierListPanelComponent,
  ],
  templateUrl: './custom-slot.component.html',
  styleUrl: './custom-slot.component.scss',
})
export class CustomSlotComponent {
  readonly control = input.required<AnyControlSpec>();
  readonly disabled = input(false);
  readonly poolId = input<string | null>(null);

  protected readonly store = inject(SettingsWorkbenchStore);

  protected readonly slot = computed(() => {
    const control = this.control();
    return control.kind === 'custom' ? control.slot : null;
  });

  protected readonly logo = computed(() =>
    this.store.read<string | null>('logo'),
  );

  protected readonly signUpChannelId = computed(() =>
    this.store.read<string>('discordSignUpChannelId'),
  );

  protected readonly poolChannelId = computed(() =>
    this.store.read<string>('channelId', this.poolId()),
  );

  protected readonly draftStart = computed(() =>
    this.store.read<string>('draftStart', this.poolId()),
  );

  protected readonly draftEnd = computed(() =>
    this.store.read<string>('draftEnd', this.poolId()),
  );

  protected readonly multiPool = computed(() => this.store.poolCount() > 1);

  protected readonly prizeSplit = computed(() =>
    this.store.read<PrizeShare[]>('prizeSplit'),
  );

  protected readonly prizeTotal = computed(() =>
    this.prizeSplit().reduce((sum, share) => sum + share.percent, 0),
  );

  protected setPoolValue(key: string, value: string): void {
    this.store.write(key, value, this.poolId());
  }

  protected setSignUpChannel(value: string): void {
    this.store.write('discordSignUpChannelId', value);
  }

  protected applyWindowToAll(): void {
    const id = this.poolId();
    if (id) this.store.applyWindowToAllPools(id);
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
