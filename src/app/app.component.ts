import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth0.service';
import { SettingsService } from './pages/settings/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  userDropdown = false;
  menuDropdown = false;
  theme: string = '';

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    let shiny = Math.floor(Math.random() * 100);
    if (shiny === 0) {
      this.theme = 'shiny dark:darkshiny';
    } else {
      let settingsTheme = this.settingsService.settingsData.theme;
      if (settingsTheme && ['light', 'dark'].includes(settingsTheme)) {
        this.theme = settingsTheme;
      }
    }
  }
}
