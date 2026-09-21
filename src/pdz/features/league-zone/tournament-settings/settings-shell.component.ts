import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-settings-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TournamentSettingsStore],
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class SettingsShellComponent implements OnInit {
  private readonly store = inject(TournamentSettingsStore);

  ngOnInit(): void {
    this.store.load();
  }
}
