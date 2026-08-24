import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorComponent } from './layout/error/error.component';
import { TopNavbarComponent } from './layout/top-navbar/top-navbar.component';
import { SpriteFiltersComponent } from './shared/images/sprite-filters/sprite-filters.component';
import { RouteEnterDirective } from './shared/layout/route-enter.directive';

@Component({
  selector: 'pdz-root',
  templateUrl: './pdz.component.html',
  styleUrl: './pdz.component.scss',
  imports: [
    RouterOutlet,
    RouteEnterDirective,
    TopNavbarComponent,
    ErrorComponent,
    SpriteFiltersComponent,
  ],
})
export class PDZComponent {}
