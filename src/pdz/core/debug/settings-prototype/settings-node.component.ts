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
import { SettingsNode, nodeKeys } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

@Component({
  selector: 'pdz-settings-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArtifactCardComponent, IconComponent, NodeControlComponent],
  templateUrl: './settings-node.component.html',
  styleUrl: './settings-node.component.scss',
})
export class SettingsNodeComponent {
  readonly node = input.required<SettingsNode>();
  readonly locked = input(false);

  protected readonly store = inject(SettingsWorkbenchStore);

  protected readonly dirty = computed(() => {
    const keys = new Set(nodeKeys(this.node()));
    return this.store.dirtyKeys().some((key) => keys.has(key));
  });

  protected readonly controls = computed(() => {
    const value = this.store.draft();
    return this.node().controls.filter(
      (control) => !control.showWhen || control.showWhen(value),
    );
  });

  protected readonly error = computed(() => this.store.errorFor(this.node().id));
}
