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

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('shinyunlocked')) {
      let shiny = Math.floor(Math.random() * 100);
      if (shiny === 0) {
        this.settingsService.settingsData.theme = 'shiny';
        localStorage.setItem('shinyunlocked', 'true');
      }
    }
  }

  getTheme() {
    console.log(this.settingsService.settingsData.theme);
    switch (this.settingsService.settingsData.theme) {
      case 'shiny':
        return 'shiny dark:darkshiny';
      case 'graymode':
        return ' graycolorblind dark:darkcolorblind';
      default:
        return 'classic dark:darkclassic';
    }
  }
}
