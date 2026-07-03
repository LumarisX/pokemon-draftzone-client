import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TournamentNavComponent } from '../tournament-nav/tournament-nav.component';

@Component({
  selector: 'pdz-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrl: './tournament-layout.component.scss',
  imports: [RouterOutlet, TournamentNavComponent, IconComponent],
})
export class TournamentLayoutComponent {
  private router = inject(Router);

  navOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.navOpen.set(false));
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }
}
