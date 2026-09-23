import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { draftNotStarted } from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-pool-order',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    IconComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
  ],
  templateUrl: './pool-order.component.html',
  styleUrl: './pool-order.component.scss',
})
export class PoolOrderComponent {
  readonly poolId = input.required<string>();
  readonly disabled = input(false);

  protected readonly store = inject(TournamentSettingsStore);

  protected readonly pool = computed(
    () => this.store.pools().find((entry) => entry.id === this.poolId())!,
  );

  protected readonly teams = computed(() =>
    this.store.poolTeams(this.poolId()),
  );

  protected readonly randomSeeding = computed(
    () => this.pool()?.useRandomSeeding ?? false,
  );

  protected readonly started = computed(() => {
    const pool = this.pool();
    return pool ? !draftNotStarted(pool.status) : false;
  });

  protected readonly canReorder = computed(
    () => !this.disabled() && !this.started() && !this.randomSeeding(),
  );

  protected readonly otherPools = computed(() =>
    this.store.pools().filter((entry) => entry.id !== this.poolId()),
  );

  protected readonly unassigned = computed(() => this.store.unassigned());

  protected toggleSeeding(): void {
    this.store.write('useRandomSeeding', !this.randomSeeding(), this.poolId());
  }

  protected drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.store.renumberPool(
      this.poolId(),
      event.previousIndex,
      event.currentIndex,
    );
  }

  protected move(teamId: string | null, target: string): void {
    if (!teamId) return;
    this.store.assignTeam(teamId, target === 'unassigned' ? null : target);
  }

  protected claim(teamId: string | null): void {
    if (!teamId) return;
    this.store.assignTeam(teamId, this.poolId());
  }
}
