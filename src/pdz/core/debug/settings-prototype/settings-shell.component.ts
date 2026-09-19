import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsWorkbenchStore } from './settings-workbench.store';

@Component({
  selector: 'pdz-settings-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsWorkbenchStore],
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class SettingsShellComponent {}
