import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { TierPokemon } from '../../interfaces/tier-pokemon.interface';
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
    pokemon?: Pokemon;
    skipTime?: Date;
  }[][];

  myTeam!: LeagueTeam;

  leagueService = inject(LeagueZoneService);
  ngOnInit(): void {
    // Placeholder IDs - user will decide how to obtain these later
    const leagueId = 'pdbls2'; // Example ID, replace with actual logic later
    const teamId = '68c44121b0a184364eb03db9'; // Example ID, replace with actual logic later

    this.leagueService.getTeamDetails(leagueId, teamId).subscribe((data) => {
      this.myTeam = data;
    });

    this.leagueService
      .getDraftOrder('68c5a1c6f1ac9b585a542b86')
      .subscribe((data) => {
        console.log(data);
        this.draftOrder = data;
      });
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

  timeUntil(time: Date | string | undefined): string | null {
    if (!time) return null;
    const targetTime = new Date(time);
    const now = new Date();
    const diffMs = targetTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return '0m'; // Or some other indicator for past/current time
    }

    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const diffHours = diffMs / (1000 * 60 * 60);
      return `${diffHours.toFixed(1)}h`;
    }
  }
}
