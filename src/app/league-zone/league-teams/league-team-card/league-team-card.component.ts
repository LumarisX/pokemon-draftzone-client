import { Component, Input } from '@angular/core';
import { Pokemon } from '../../../interfaces/draft';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type TeamPokemon = Pokemon & {
  tier: number | string;
  record: {
    deaths: number;
    kills: number;
    brought: number;
  };
};

@Component({
  selector: 'pdz-league-team-card',
  imports: [
    CommonModule,
    SpriteComponent,
    PlusSignPipe,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './league-team-card.component.html',
  styleUrl: './league-team-card.component.scss',
})
export class LeagueTeamCardComponent {
  @Input({ required: true })
  teamDetails!: {
    teamName: string;
    coaches: string[];
    logo?: string;
    roster: TeamPokemon[];
    record: {
      wins: number;
      losses: number;
      diff: number;
    };
    timezone: string;
  };

  data: 'overview' | 'stats' = 'overview';
}
