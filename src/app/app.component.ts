import { Component, inject } from '@angular/core';
import { SettingsService } from './pages/settings/settings.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { svgIcons } from './images/icons';

@Component({
  selector: 'pdz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  private settingsService = inject(SettingsService);

  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  constructor() {
    const matIconRegistry = this.matIconRegistry;
    const domSanitizer = this.domSanitizer;

    Object.entries(svgIcons).forEach(([name, data]) => {
      matIconRegistry.addSvgIconLiteral(
        name,
        domSanitizer.bypassSecurityTrustHtml(data),
      );
      matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    });
    document.documentElement.setAttribute('pdz-theme', 'normal');
  }

  getTheme() {
    const classes: string[] = [];
    // document.documentElement.setAttribute('pdz-theme-mode', 'dark');

    // if (this.settingsService.settingsData.ldMode === 'dark') {
    //   document.documentElement.setAttribute('pdz-theme-mode', 'dark');
    //   this.settingsService.updateLDMode(
    //     this.settingsService.settingsData.ldMode,
    //   );
    // } else {
    //   document.documentElement.setAttribute('pdz-theme-mode', 'light');
    // }
    // switch (this.settingsService.settingsData.theme) {
    //   case 'shiny':
    //     classes.push('shiny dark:darkshiny');
    //     break;
    //   case 'graymode':
    //     classes.push('graycolorblind dark:darkcolorblind');
    //     break;
    //   case 'christmas':
    //     classes.push('christmas dark:darkchristmas');
    //     break;
    //   default:
    classes.push('classic dark:darkclassic');
    // }
    // document.documentElement.setAttribute(
    //   'theme-name',
    //   this.settingsService.settingsData.theme ?? 'classic',
    // );
    return classes;
  }
}
