import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../league-zone.service';
import { StageSwitcherComponent } from '../league-widgets/stage-switcher/stage-switcher.component';
import { League } from '../league.interface';
import { PokemonStandingsComponent } from './pokemon-standings/pokemon-standings.component';
import { TeamStandingsComponent } from './team-standings/team-standings.component';

@Component({
  selector: 'pdz-league-standings',
  imports: [
    CommonModule,
    TeamStandingsComponent,
    PokemonStandingsComponent,
    RouterModule,
    LoadingComponent,
    StageSwitcherComponent,
  ],
  templateUrl: './league-standings.component.html',
  styleUrls: ['./league-standings.component.scss'],
})
export class LeagueStandingsComponent implements OnInit {
  private leagueService = inject(LeagueZoneService);

  filters: League.StandingsFilter[] = [];
  views: Record<string, League.StandingsView> = {};
  isLoading = true;
  error: string | null = null;

  // Independent filters: a coach may want the "All Stages" team standings
  // next to just the playoffs' Pokémon standings, or vice versa.
  teamFilter = 'all';
  pokemonFilter = 'all';

  ngOnInit() {
    this.loadStandings();
  }

  private loadStandings() {
    this.leagueService.getStandings().subscribe({
      next: (data) => {
        this.filters = data.filters;
        this.views = data.views;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading standings:', err);
        this.error = 'Failed to load standings';
        this.isLoading = false;
      },
    });
  }

  get teamStandings(): League.TeamStandingsTable | null {
    return this.views[this.teamFilter]?.teamStandings ?? null;
  }

  get pokemonStandings(): League.PokemonStanding[] {
    return this.views[this.pokemonFilter]?.pokemonStandings ?? [];
  }
}
