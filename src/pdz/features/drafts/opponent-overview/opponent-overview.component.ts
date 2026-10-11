import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';

@Component({
  selector: 'pdz-opponent-overview',
  imports: [RouteEnterDirective, RouterOutlet],
  templateUrl: './opponent-overview.component.html',
  styleUrl: './opponent-overview.component.scss',
})
export class OpponentOverviewComponent {}
