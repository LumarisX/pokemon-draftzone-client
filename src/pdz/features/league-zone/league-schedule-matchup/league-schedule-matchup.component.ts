import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

@Component({
  selector: 'pdz-league-schedule-matchup',
  imports: [CommonModule, IconComponent, SpriteComponent],
  templateUrl: './league-schedule-matchup.component.html',
  styleUrls: ['./league-schedule-matchup.component.scss'],
})
export class LeagueScheduleMatchupComponent {
  selectedMatch: number = 0;
  cardOpen: boolean = false;
}
