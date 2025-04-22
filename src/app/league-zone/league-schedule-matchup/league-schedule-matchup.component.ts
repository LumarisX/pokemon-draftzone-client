import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../interfaces/draft';
import { SpriteComponent } from '../../images/sprite/sprite.component';

@Component({
  selector: 'app-league-schedule-matchup',
  imports: [CommonModule, MatIconModule, SpriteComponent],
  templateUrl: './league-schedule-matchup.component.html',
  styleUrl: './league-schedule-matchup.component.scss',
})
export class LeagueScheduleMatchupComponent {
  selectedMatch: number = 0;
  cardOpen: boolean = false;
}
