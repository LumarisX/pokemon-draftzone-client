import { AsyncPipe } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@pdz/core/services/auth0.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { SettingsService } from '../settings.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';

@Component({
  selector: 'pdz-login-button',
  imports: [
    AsyncPipe,
    OverlayModule,
    IconComponent,
    ButtonComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
  ],
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
})
export class LoginButtonComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settingsService = inject(SettingsService);
  private readonly dialogs = inject(DialogService);

  authenticated: boolean = false;

  ngOnInit(): void {
    this.initAuthSubscription();
  }

  private initAuthSubscription(): void {
    this.auth.isAuthenticated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((authenticated) => {
        this.authenticated = authenticated;
        if (authenticated) {
          this.loadSettings();
        }
      });
  }

  private loadSettings(): void {
    this.settingsService
      .getSettings()
      .pipe(
        take(1),
        switchMap((serverSettings) => {
          if (serverSettings) {
            this.settingsService.setSettings(serverSettings, {
              source: 'server',
            });
            return of(null);
          }
          return this.auth.user$.pipe(take(1));
        }),
      )
      .subscribe((userData) => {
        if (userData?.settings) {
          this.settingsService.setSettings(userData.settings, {
            source: 'server',
          });
        }
      });
  }

  openSettings(): void {
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
