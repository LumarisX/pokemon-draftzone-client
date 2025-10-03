import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth0.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SettingsComponent } from '../../settings/settings.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { SettingsService } from '../../settings/settings.service';
import { CommonModule } from '@angular/common';

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

  authenticated: boolean = false;
  settingsOpen: boolean = false;

  ngOnInit() {
    this.checkAuthenticated();
  }

  checkAuthenticated() {
    this.auth.isAuthenticated$.subscribe((authenticated) => {
      this.authenticated = authenticated;
      if (authenticated) {
        this.auth.user$.subscribe((data) => {
          this.settingsService.setSettings(data?.settings);
        });
      }
    });
  }

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
