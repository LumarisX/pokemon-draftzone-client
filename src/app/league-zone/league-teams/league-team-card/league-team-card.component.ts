import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';

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
  styleUrls: ['./league-team-card.component.scss'],
})
export class LeagueTeamCardComponent {
  @Input({ required: true })
  teamDetails!: League.LeagueTeam;

  data: 'overview' | 'stats' = 'overview';

  getLogoUrl(): string | undefined {
    if (!this.teamDetails.logo) return undefined;
    return `https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/${this.teamDetails.logo}`;
  }
}
