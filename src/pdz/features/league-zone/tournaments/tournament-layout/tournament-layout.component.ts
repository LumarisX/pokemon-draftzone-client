import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';
import { TournamentNavComponent } from '../tournament-nav/tournament-nav.component';

@Component({
  selector: 'pdz-tournament-layout',
  templateUrl: './tournament-layout.component.html',
  styleUrl: './tournament-layout.component.scss',
  imports: [RouterOutlet, RouteEnterDirective, TournamentNavComponent],
})
export class TournamentLayoutComponent {}
