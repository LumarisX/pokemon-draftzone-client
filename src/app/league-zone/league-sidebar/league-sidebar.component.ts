// --------------------------------------------------------------------------------
// 1. league-sidebar.component.ts
// Location: ./league-sidebar.component.ts
// (No functional changes in this file from v2, only linking to updated HTML/SCSS)
// --------------------------------------------------------------------------------
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav'; // Retained for sidenav structure
import { MatListModule } from '@angular/material/list'; // Retained for list structure & accessibility
import { MatIconModule } from '@angular/material/icon'; // Retained for easy icon usage
import { MatButtonModule } from '@angular/material/button'; // Retained for button structure, will be restyled
import { MatDividerModule } from '@angular/material/divider'; // Retained for semantic dividers, will be restyled
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'pdz-league-sidebar',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './league-sidebar.component.html', // Links to updated HTML
  styleUrls: ['./league-sidebar.component.scss'], // Links to updated SCSS
})
export class LeagueSidebarComponent {
  leagueExpanded: boolean = false;
  standingsExpanded: boolean = false;
  myTeamExpanded: boolean = false;

  // League Logo - replace with your actual logo path
  leagueLogoUrl: string = '../../../assets/images/battle-zone/pdbls2.png'; // Placeholder logo, light bg

  toggleLeague(): void {
    this.leagueExpanded = !this.leagueExpanded;
  }

  toggleStandings(): void {
    this.standingsExpanded = !this.standingsExpanded;
  }

  toggleMyTeam(): void {
    this.myTeamExpanded = !this.myTeamExpanded;
  }
}

// --------------------------------------------------------------------------------
// 2. league-sidebar.component.html
// Location: ./league-sidebar.component.html
// (RouterLinks updated to be relative)
// --------------------------------------------------------------------------------
/*
<mat-nav-list class="sidebar-nav-list">
  <div class="league-header-container" routerLink="./"> <div class="logo-container">
      <img [src]="leagueLogoUrl" alt="League Logo" class="league-logo">
    </div>
    <div class="league-name-container">
      <span class="league-name">My Awesome League</span>
    </div>
  </div>
  <mat-divider class="header-divider"></mat-divider>

  <a mat-list-item (click)="toggleLeague()" [class.expanded]="leagueExpanded" class="expandable-main-item">
    <mat-icon matListItemIcon>gavel</mat-icon>
    <span matListItemTitle>League</span>
    <span class="menu-spacer"></span>
    <mat-icon matListItemIcon class="expansion-indicator">{{ leagueExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
  </a>
  @if (leagueExpanded) {
    <mat-nav-list class="submenu-container">
      <a mat-list-item routerLink="./rules" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Rules</span>
      </a>
    </mat-nav-list>
  }
  <mat-divider class="menu-item-divider"></mat-divider>

  <a mat-list-item (click)="toggleStandings()" [class.expanded]="standingsExpanded" class="expandable-main-item">
    <mat-icon matListItemIcon>leaderboard</mat-icon>
    <span matListItemTitle>Standings</span>
    <span class="menu-spacer"></span>
    <mat-icon matListItemIcon class="expansion-indicator">{{ standingsExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
  </a>
  @if (standingsExpanded) {
    <mat-nav-list class="submenu-container">
      <a mat-list-item routerLink="./standings/coach" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Coach Standings</span>
      </a>
      <a mat-list-item routerLink="./standings/pokemon" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Pokemon Standings</span>
      </a>
    </mat-nav-list>
  }
  <mat-divider class="menu-item-divider"></mat-divider>

  <a mat-list-item (click)="toggleMyTeam()" [class.expanded]="myTeamExpanded" class="expandable-main-item">
    <mat-icon matListItemIcon>group</mat-icon>
    <span matListItemTitle>My Team</span>
    <span class="menu-spacer"></span>
    <mat-icon matListItemIcon class="expansion-indicator">{{ myTeamExpanded ? 'expand_less' : 'expand_more' }}</mat-icon>
  </a>
  @if (myTeamExpanded) {
    <mat-nav-list class="submenu-container">
      <a mat-list-item routerLink="./team" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Overview</span>
      </a>
      <a mat-list-item routerLink="./draft" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Draft</span>
      </a>
      <a mat-list-item routerLink="./trade" routerLinkActive="active-submenu-link" class="submenu-item"> <span matListItemTitle class="submenu-item-text">Trade</span>
      </a>
    </mat-nav-list>
  }
  <mat-divider class="menu-item-divider"></mat-divider>

  <a mat-list-item routerLink="./schedule" routerLinkActive="active-main-link" class="main-menu-item"> <mat-icon matListItemIcon>event</mat-icon>
    <span matListItemTitle>Schedule</span>
  </a>
  <mat-divider class="menu-item-divider"></mat-divider>

  <div class="sidebar-spacer"></div>

  <div class="manage-button-wrapper">
    <a mat-stroked-button routerLink="../manage" class="manage-button custom-manage-button"> <mat-icon>settings</mat-icon>
      Manage
    </a>
  </div>
</mat-nav-list>
*/

// --------------------------------------------------------------------------------
// 3. league-sidebar.component.scss
// Location: ./league-sidebar.component.scss
// (Styles updated for a unique light mode, less Material-like)
// --------------------------------------------------------------------------------
/*
// Define custom theme colors (light mode)
$sidebar-background: #ffffff; // Clean white background
$sidebar-text-color: #333333; // Dark grey text
$sidebar-icon-color: #555555; // Slightly lighter grey for icons
$sidebar-divider-color: #e0e0e0; // Light grey for dividers
$sidebar-hover-background: #f0f8ff; // AliceBlue - a very light blue for hover
$sidebar-hover-text-color: #2a7ab0; // A complementary blue for hover text/icons
$sidebar-active-background: #e0f0ff; // A slightly more pronounced blue for active items
$sidebar-active-text-color: #1a5f8a; // Darker blue for active text/icons
$sidebar-accent-color: #007bff; // A generic bootstrap-like blue for primary accents if needed, or a custom one. Let's use a teal.
$sidebar-accent-color-teal: #20c997; // A fresh teal
$sidebar-active-indicator-color: $sidebar-accent-color-teal; // Teal for active indicators

:host {
  display: block;
  height: 100%;
  background-color: $sidebar-background;
  color: $sidebar-text-color;
  overflow: hidden; // Prevent host itself from scrolling
  border-right: 1px solid $sidebar-divider-color; // Subtle border to separate from content
}

.sidebar-nav-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 0;

  // Remove default Material padding from mat-nav-list itself
  padding: 0 !important;

  // Override mat-list-item styles
  .mat-list-item {
    color: $sidebar-text-color !important; // Ensure text color is applied
    height: 48px !important; // Consistent height
    padding: 0 16px !important; // Custom padding
    font-weight: 400; // Default font weight
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;

    // Remove Material's ripple effect if desired (might require ::ng-deep or more specific selectors)
    // For now, we'll style over it.

    .mat-list-item-content {
      padding: 0 !important; // Remove Material's internal padding
    }

    .mat-icon {
      color: $sidebar-icon-color !important; // Icon color
      margin-right: 16px !important;
      transition: color 0.2s ease-in-out;
    }

    &:hover {
      background-color: $sidebar-hover-background !important;
      color: $sidebar-hover-text-color !important;
      .mat-icon {
        color: $sidebar-hover-text-color !important;
      }
    }
  }
}

.league-header-container {
  padding: 20px 16px; // More padding for header
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: $sidebar-hover-background;
  }

  .logo-container {
    margin-bottom: 10px;
    padding: 0 10px;
  }

  .league-logo {
    max-width: 100%;
    height: auto;
    max-height: 70px; // Adjusted max height
    object-fit: contain;
  }

  .league-name-container {
    margin-top: 8px;
  }

  .league-name {
    font-size: 1.2em; // Slightly adjusted size
    font-weight: 600; // Bold
    color: $sidebar-text-color; // Match main text color
  }
}

.header-divider, .menu-item-divider {
  border-top-color: $sidebar-divider-color !important; // Use important to override Material if needed
  margin: 4px 0; // Add some vertical margin to dividers
}
.menu-item-divider:last-of-type {
    display:none; // Don't show last divider before spacer
}


// Common styles for main menu items (both expandable and direct links)
.main-menu-item,
.expandable-main-item {
  // Styles are mostly handled by the .mat-list-item override above
  // Specific adjustments can be made here if needed
  width: 100%; // Ensure full width

  .menu-spacer {
    flex-grow: 1;
  }
}

.expansion-indicator {
  transition: transform 0.2s ease-in-out;
  color: $sidebar-icon-color !important;
}

.expandable-main-item.expanded {
  background-color: $sidebar-hover-background !important; // Light background when expanded
  // color: $sidebar-active-text-color !important; // Text color can remain hover or become active
  .mat-icon {
    // color: $sidebar-active-text-color !important;
  }
  .expansion-indicator {
    transform: rotate(180deg);
  }
}

// Active link styling for main non-expandable items
.active-main-link {
  background-color: $sidebar-active-background !important;
  color: $sidebar-active-text-color !important;
  font-weight: 500 !important; // Slightly bolder for active

  .mat-icon {
    color: $sidebar-active-text-color !important;
  }

  // Add a left border for active items for a common visual cue
  position: relative; // Needed for the ::before pseudo-element
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%; // Cover more of the item height
    background-color: $sidebar-active-indicator-color;
    border-radius: 0 2px 2px 0; // Slight rounding on the indicator
  }
}

.submenu-container {
  background-color: lighten($sidebar-background, 2%); // Very slightly off-white, or keep same as main
  // background-color: #f9f9f9; // Example: slightly different background for submenu
  max-height: 180px; // MAX HEIGHT FOR SUBMENU - ADJUST AS NEEDED
  overflow-y: auto;
  padding-left: 0; // Reset padding if mat-nav-list adds any

  // Custom scrollbar for webkit browsers
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: darken($sidebar-background, 5%); // Slightly darker track
  }
  &::-webkit-scrollbar-thumb {
    background: $sidebar-divider-color; // Scrollbar thumb color
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: darken($sidebar-divider-color, 10%);
  }

  .submenu-item {
    height: 40px !important;
    // Indent submenu items: initial padding + icon width + desired indent
    padding-left: calc(16px + 24px + 12px) !important; // 16px (item) + 24px (icon area if no icon) + 12px indent
    font-size: 0.9em;

    // If submenu items have icons, adjust padding-left and icon margin
    .mat-icon { // If submenu items were to have icons
       margin-left: -28px; // Adjust to align with main item icons
    }
  }
}

// Active link styling for submenu items
.active-submenu-link {
  background-color: $sidebar-active-background !important;
  color: $sidebar-active-text-color !important;
  font-weight: 500 !important;

  // Optional: smaller visual indicator for active submenu item
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: calc(16px + 24px + 12px - 12px); // Align with text start
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 3px;
    background-color: $sidebar-active-indicator-color;
    border-radius: 50%;
  }
}


.sidebar-spacer {
  flex-grow: 1;
}

.manage-button-wrapper {
  padding: 16px;
  border-top: 1px solid $sidebar-divider-color;
}

// Custom styling for the "Manage" button (overriding mat-stroked-button)
.custom-manage-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0 !important; // Custom padding
  font-size: 0.95em;
  font-weight: 500;

  // Override Material button styles
  background-color: transparent !important;
  color: $sidebar-text-color !important;
  border: 1px solid $sidebar-divider-color !important;
  border-radius: 4px !important; // Custom border radius
  box-shadow: none !important; // Remove Material shadow

  .mat-icon {
    margin-right: 8px !important;
    color: $sidebar-icon-color !important; // Match icon color
  }

  &:hover {
    background-color: $sidebar-hover-background !important;
    color: $sidebar-hover-text-color !important;
    border-color: $sidebar-hover-text-color !important;
    .mat-icon {
      color: $sidebar-hover-text-color !important;
    }
  }

  // Remove ripple if present from mat-button
  // .mat-ripple-element {
  //   display: none !important;
  // }
}
*/

// --------------------------------------------------------------------------------
// 4. Example Usage: app.component.html (No changes from v2)
// This sets up a fixed-width sidebar and a content area to its right.
// --------------------------------------------------------------------------------
/*
<mat-sidenav-container class="app-container">
  <mat-sidenav #sidenav mode="side" opened class="app-sidenav" [fixedInViewport]="true" [fixedTopGap]="0">
    <pdz-league-sidebar></pdz-league-sidebar>
  </mat-sidenav>

  <mat-sidenav-content class="app-content">
    <router-outlet></router-outlet>
  </mat-sidenav-content>
</mat-sidenav-container>
*/

// --------------------------------------------------------------------------------
// 5. Example SCSS for app.component.scss (or global styles.scss)
// (Adjusted .app-sidenav for the new light theme if needed, e.g. no box-shadow if border is enough)
// --------------------------------------------------------------------------------
/*
// Ensure you have Angular Material theme and typography imported, typically in styles.scss
// @use '@angular/material' as mat;
// @include mat.core();
// ... (your theme definition)
// @include mat.all-component-themes($my-app-theme); // Or specific component themes


html, body {
  height: 100%;
  margin: 0;
  font-family: 'Roboto', "Helvetica Neue", sans-serif;
  background-color: #f4f6f9; // Content area background (light grey)
}

.app-container {
  height: 100vh;
  width: 100vw;
}

.app-sidenav {
  width: 260px; // FIXED WIDTH FOR THE SIDEBAR
  // border-right: 1px solid #e0e0e0; // Sidebar itself now has a border-right in its :host style
  // box-shadow: none; // Removed shadow as the border might be enough for separation
                       // Or use a very subtle one:
  box-shadow: 2px 0 6px rgba(0,0,0,0.05);
}

.app-content {
  padding: 20px;
  background-color: #f4f6f9; // A common dashboard content area background color
}
*/

// --------------------------------------------------------------------------------
// 6. Standalone Setup (No changes from v2, ensure provideAnimationsAsync is used)
// main.ts:
// import { bootstrapApplication } from '@angular/platform-browser';
// import { provideRouter } from '@angular/router';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { AppComponent } from './app/app.component';
// import { routes } from './app/app.routes';

// bootstrapApplication(AppComponent, {
//   providers: [
//     provideRouter(routes),
//     provideAnimationsAsync()
//   ]
// })
// .catch(err => console.error(err));

// app.component.ts (standalone):
// import { Component } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { LeagueSidebarComponent } from './league-sidebar/league-sidebar.component';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [
//     RouterModule,
//     MatSidenavModule,
//     LeagueSidebarComponent
//   ],
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss'],
// })
// export class AppComponent {}
// --------------------------------------------------------------------------------
