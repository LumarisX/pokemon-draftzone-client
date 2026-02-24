import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { CoachStandingsComponent } from './coach-standings/coach-standings.component';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';
import { League } from '../league.interface';
import { LoadingComponent } from '../../images/loading/loading.component';
import { IconComponent } from '../../images/icon/icon.component';

@Component({
  selector: 'pdz-league-standings',
  imports: [
    CommonModule,
    CoachStandingsComponent,
    PokemonStandingsComponent,
    RouterModule,
    LoadingComponent,
    IconComponent,
  ],
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
