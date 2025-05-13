import { OverlayModule } from '@angular/cdk/overlay';
import { Component, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, of, map } from 'rxjs';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { svgIcons } from '../../images/icons';
import { UnreadService } from '../../services/unread.service';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from '../../services/auth0.service';
import { SettingsComponent } from '../settings/settings.component';
import { LogoSVG } from '../../images/svg-components/logo.component';
import { CommonModule } from '@angular/common';
import { YourTabsComponent } from '../main-tab-slide/main-tab-slide.component';

@Component({
  selector: 'pdz-top-navbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatBadgeModule,
    OverlayModule,
    MatIconModule,
    MatToolbarModule,
    MatMenuModule,
    MatButtonModule,
    SettingsComponent,
    RouterModule,
    YourTabsComponent,
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.scss',
})
export class TopNavbarComponent implements OnInit {
  settingsOpen: boolean = false;

  draftPath = DraftOverviewPath;
  newsBadge = this.unreadService.newsCount;

  constructor(
    public auth: AuthService,
    private settingsService: SettingsService,
    private unreadService: UnreadService,
    private router: Router,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
  ) {
    Object.entries(svgIcons).forEach(([name, data]) => {
      matIconRegistry.addSvgIconLiteral(
        name,
        domSanitizer.bypassSecurityTrustHtml(data),
      );
      matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    });
    this.checkAuthenticated();
  }

  ngOnInit(): void {
    const shiny = Math.floor(Math.random() * 100);
    if (shiny === 0) {
      this.settingsService.setSettings({ shinyUnlock: true });
      this.settingsService.updateSettings();
    }
  }

  authenticated: boolean = false;

  checkAuthenticated() {
    this.auth.isAuthenticated().subscribe((authenticated) => {
      this.authenticated = authenticated;
      if (authenticated) {
        this.auth.user().subscribe((data) => {
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
