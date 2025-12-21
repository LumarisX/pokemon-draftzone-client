import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../../services/auth0.service';
import { SettingApiService } from '../../../services/setting.service';
import { SettingsComponent } from '../../settings/settings.component';
import { SettingsService } from '../../settings/settings.service';

@Component({
  selector: 'pdz-login-button',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    SettingsComponent,
    OverlayModule,
  ],
  templateUrl: './login-button.component.html',
  styleUrl: './login-button.component.scss',
})
export class LoginButtonComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settingsService = inject(SettingsService);
  private readonly settingApi = inject(SettingApiService);

  authenticated: boolean = false;
  settingsOpen: boolean = false;

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
    this.settingApi
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
          // Fallback to user settings if no server settings
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

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }
}
