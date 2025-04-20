import { Component } from '@angular/core';
import { CoachStandingsComponent } from './coach-standings/coach-standings.component';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';

@Component({
  selector: 'app-league-standings',
  imports: [CoachStandingsComponent, PokemonStandingsComponent],
  templateUrl: './league-standings.component.html',
  styleUrl: './league-standings.component.scss',
})
export class LeagueStandingsComponent {}
