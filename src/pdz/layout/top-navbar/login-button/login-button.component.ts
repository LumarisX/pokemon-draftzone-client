import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SETTINGS_PATH } from '@pdz/core/route-paths';
import { AuthService } from '@pdz/core/services/auth0.service';
import { RoleService } from '@pdz/core/services/role.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { filter, switchMap, take } from 'rxjs/operators';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'pdz-login-button',
  imports: [
    ButtonComponent,
    IconComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    RouterLink,
  ],
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginButtonComponent {
  private readonly auth = inject(AuthService);
  private readonly settingsService = inject(SettingsService);

  protected readonly settingsLink = ['/', SETTINGS_PATH];
  readonly authenticated = toSignal(this.auth.isAuthenticated$, {
    initialValue: false,
  });
  readonly me = toSignal(inject(RoleService).me$, { initialValue: null });

  constructor() {
    this.auth.isAuthenticated$
      .pipe(
        filter(Boolean),
        switchMap(() => this.settingsService.getSettings().pipe(take(1))),
        takeUntilDestroyed(),
      )
      .subscribe((serverSettings) =>
        this.settingsService.setSettings(serverSettings),
      );
  }

  login(): void {
    this.auth.login();
  }

  logout(): Promise<void> {
    return this.auth.logout();
  }
}
