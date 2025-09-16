import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
import { LeagueDraftingService } from '../../services/league-drafting.service';
import {
  LeaguePokemon,
  LeagueTeam,
  LeagueZoneService,
} from '../../services/leagues/league-zone.service';
import { NumberSuffixPipe } from '../../util/pipes/number-suffix.pipe';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';

@Component({
  selector: 'pdz-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
    NumberSuffixPipe,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftingComponent implements OnInit {
  draftOrder!: {
    teamName: string;
    status?: string;
    pokemon?: Pokemon;
  }[][];

  myTeam!: LeagueTeam;

  draftingService = inject(LeagueDraftingService);
  leagueService = inject(LeagueZoneService);
  ngOnInit(): void {
    // Placeholder IDs - user will decide how to obtain these later
    const leagueId = '68c5a1c6f1ac9b585a542b8a'; // Example ID, replace with actual logic later
    const teamId = '68c44121b0a184364eb03db9'; // Example ID, replace with actual logic later

    this.leagueService.getTeamDetails(leagueId, teamId).subscribe((data) => {
      this.myTeam = data;
    });

    this.draftingService
      .getDraftOrder()
      .subscribe((data) => (this.draftOrder = data));
  }

  moveUp(picks: LeaguePokemon[], index: number) {
    if (!index || index >= picks.length) return;
    const temp = picks[index];
    picks[index] = picks[index - 1];
    picks[index - 1] = temp;
  }

  draftPokemon(pokemon: TierPokemon & { tier: string }) {
    this.myTeam.picks[0].push({
      name: pokemon.name,
      id: pokemon.id,
      tier: pokemon.tier,
    });
  }
}
