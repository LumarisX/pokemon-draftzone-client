import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject, combineLatest, map, of } from 'rxjs';
import { LeagueAdsService } from './services/league-ads.service';
import { AuthService } from './services/auth0.service';
import { DraftOverviewPath } from './drafts/draft-overview/draft-overview-routing.module';
import { svgIcons } from './images/icons';
import { SettingsService } from './pages/settings/settings.service';
import { Router } from '@angular/router';
import { UnreadService } from './services/unread.service';

@Component({
  selector: 'pdz-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(private settingsService: SettingsService) {}

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
