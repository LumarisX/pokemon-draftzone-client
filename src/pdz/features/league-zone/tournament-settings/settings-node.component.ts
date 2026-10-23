import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { HelpComponent } from '@pdz/shared/help/help.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { NodeControlComponent } from './node-control.component';
import {
  AnyControlSpec,
  AnyNode,
  ValueBag,
  controlVisible,
  draftNotStarted,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-settings-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HelpComponent, IconComponent, NodeControlComponent],
  templateUrl: './settings-node.component.html',
  styleUrl: './settings-node.component.scss',
})
export class SettingsNodeComponent {
  readonly node = input.required<AnyNode>();
  readonly disabled = input(false);
  readonly gateReason = input<string | null>(null);
  readonly poolId = input<string | null>(null);

  protected readonly store = inject(TournamentSettingsStore);

  private readonly bag = computed<ValueBag>(() => {
    const id = this.poolId();
    if (!id) return this.store.draft();
    return this.store.pools().find((pool) => pool.id === id)!;
  });

  protected readonly controls = computed(() => {
    const bag = this.bag();
    return this.node().controls.filter((control) =>
      controlVisible(control as AnyControlSpec, bag),
    );
  });

  private readonly poolStarted = computed(() => {
    const id = this.poolId();
    const pool = id ? this.store.pools().find((entry) => entry.id === id) : null;
    return pool ? !draftNotStarted(pool.status) : false;
  });

  protected readonly fixedNote = computed(() =>
    this.poolStarted() && this.controls().some((control) => control.fixed)
      ? "Locked because this pool's draft has started. It can't change mid-draft."
      : null,
  );

  protected controlDisabled(control: AnyControlSpec): boolean {
    return this.disabled() || (!!control.fixed && this.poolStarted());
  }

  protected readonly error = computed(() =>
    this.store.errorFor(this.node().id, this.poolId()),
  );
}
