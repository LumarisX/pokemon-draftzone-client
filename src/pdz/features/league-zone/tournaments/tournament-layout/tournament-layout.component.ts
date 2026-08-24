import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavContextService } from '@pdz/core/services/nav-context.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';
import { filter } from 'rxjs/operators';
import { TournamentNavComponent } from '../tournament-nav/tournament-nav.component';

@Component({
  selector: 'pdz-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrl: './tournament-layout.component.scss',
  imports: [
    RouterOutlet,
    RouteEnterDirective,
    TournamentNavComponent,
    ButtonComponent,
    IconComponent,
  ],
  host: {
    '(document:keydown.escape)': 'closeNav()',
  },
})
export class TournamentLayoutComponent {
  private router = inject(Router);
  private navContext = inject(NavContextService);

  readonly navOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeNav());

    const drawer = {
      ariaLabel: 'Tournament navigation',
      isOpen: this.navOpen.asReadonly(),
      toggle: () => this.toggleNav(),
      close: () => this.closeNav(),
    };
    this.navContext.set(drawer);
    inject(DestroyRef).onDestroy(() => this.navContext.clear(drawer));
  }

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }
}
