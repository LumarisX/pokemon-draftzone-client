import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@pdz/core/services/auth0.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'pdz-login-button',
  imports: [
    ButtonComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    TeamLogoComponent,
  ],
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginButtonComponent {
  private readonly auth = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly dialogs = inject(DialogService);

  readonly authenticated = toSignal(this.auth.isAuthenticated$, {
    initialValue: false,
  });
  readonly user = toSignal(this.auth.user$, { initialValue: null });

  constructor() {
    this.auth.isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.settingsService.getSettings().pipe(take(1))),
        switchMap((serverSettings) =>
          serverSettings
            ? of({ settings: serverSettings })
            : this.auth.user$.pipe(take(1)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((data) => this.settingsService.setSettings(data?.settings));
  }

  async openSettings(): Promise<void> {
    const { SettingsDialogComponent } = await import(
      '../settings-dialog/settings-dialog.component'
    );
    this.dialogs.open(SettingsDialogComponent, {
      heading: 'Settings',
      size: 'md',
    });
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}
