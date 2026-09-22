import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ArtifactCardComponent } from './artifact-card.component';
import { NodeControlComponent } from './node-control.component';
import {
  AnyControlSpec,
  AnyNode,
  ArtifactSlot,
  ValueBag,
  controlVisible,
} from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-settings-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArtifactCardComponent, IconComponent, NodeControlComponent],
  templateUrl: './settings-node.component.html',
  styleUrl: './settings-node.component.scss',
})
export class SettingsNodeComponent {
  readonly node = input.required<AnyNode>();
  readonly disabled = input(false);
  readonly lockedReason = input<string | null>(null);
  readonly poolId = input<string | null>(null);
  readonly artifact = input<ArtifactSlot | null>(null);

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

  protected readonly error = computed(() =>
    this.store.errorFor(this.node().id, this.poolId()),
  );
}
