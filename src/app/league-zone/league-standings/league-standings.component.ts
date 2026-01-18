import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { CoachStandingsComponent } from './coach-standings/coach-standings.component';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';
import { League } from '../league.interface';

@Component({
  selector: 'pdz-league-standings',
  imports: [CommonModule, CoachStandingsComponent, PokemonStandingsComponent],
  templateUrl: './league-standings.component.html',
  styleUrls: ['./league-standings.component.scss'],
})
export class LeagueStandingsComponent implements OnInit {
  private leagueService = inject(LeagueZoneService);

  coachStandings: League.CoachStandingData | null = null;
  pokemonStandings: League.PokemonStanding[] = [];
  isLoading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadStandings();
  }

  private loadStandings() {
    this.leagueService.getStandings().subscribe({
      next: (data) => {
        this.coachStandings = data.coachStandings;
        this.pokemonStandings = data.pokemonStandings;
        console.log('pokemon', this.pokemonStandings);
        console.log(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading standings:', err);
        this.error = 'Failed to load standings';
        this.isLoading = false;
      },
    });
  }
}
