import { Component, inject } from '@angular/core';
import { SettingsService } from './pages/settings/settings.service';

@Component({
  selector: 'pdz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  private settingsService = inject(SettingsService);


  getTheme() {
    const classes: string[] = [];
    if (this.settingsService.settingsData.ldMode === 'dark')
      this.settingsService.updateLDMode(
        this.settingsService.settingsData.ldMode,
      );
    switch (this.settingsService.settingsData.theme) {
      case 'shiny':
        classes.push('shiny dark:darkshiny');
        break;
      case 'graymode':
        classes.push('graycolorblind dark:darkcolorblind');
        break;
      case 'christmas':
        classes.push('christmas dark:darkchristmas');
        break;
      default:
        classes.push('classic dark:darkclassic');
    }
    document.documentElement.setAttribute(
      'theme-name',
      this.settingsService.settingsData.theme ?? 'classic',
    );
    return classes;
  }
}
