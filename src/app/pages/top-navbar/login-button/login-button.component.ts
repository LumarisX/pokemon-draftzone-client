import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth0.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SettingsComponent } from '../../settings/settings.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { SettingsService } from '../../settings/settings.service';
import { CommonModule } from '@angular/common';
import { SettingApiService } from '../../../services/setting.service';
import { take } from 'rxjs/operators';

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
export class LoginButtonComponent {
  auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  private settingApi = inject(SettingApiService);

  authenticated: boolean = false;
  settingsOpen: boolean = false;

  ngOnInit() {
    this.checkAuthenticated();
    this.refreshSettingsFromServerIfAuthenticated();
  }

  checkAuthenticated() {
    this.auth.isAuthenticated$.subscribe((authenticated) => {
      this.authenticated = authenticated;
      if (authenticated) {
        this.settingApi
          .getSettings()
          .pipe(take(1))
          .subscribe((serverSettings) => {
            if (serverSettings) {
              this.settingsService.setSettings(serverSettings, {
                source: 'server',
              });
            } else {
              this.auth.user$.pipe(take(1)).subscribe((data) => {
                if (data?.settings) {
                  this.settingsService.setSettings(data.settings, {
                    source: 'server',
                  });
                }
              });
            }
          });
      }
    });
  }

  private refreshSettingsFromServerIfAuthenticated() {
    this.auth.isAuthenticated$.pipe(take(1)).subscribe((authenticated) => {
      if (!authenticated) return;
      this.settingApi
        .getSettings()
        .pipe(take(1))
        .subscribe((serverSettings) => {
          if (serverSettings) {
            this.settingsService.setSettings(serverSettings, {
              source: 'server',
            });
          }
        });
    });
  }

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
