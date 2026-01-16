import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'pdz-league-schedule-matchup',
  imports: [CommonModule, MatIconModule, SpriteComponent],
  templateUrl: './league-schedule-matchup.component.html',
  styleUrls: ['./league-schedule-matchup.component.scss'],
})
export class LeagueScheduleMatchupComponent {
  selectedMatch: number = 0;
  cardOpen: boolean = false;
}
