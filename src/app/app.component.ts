import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TeamsComponent } from './teams/teams.component';
import { draftTeamList } from './draft-team-list';
import { Team } from './team';
import { TypechartComponent } from './typechart/typechart.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, RouterOutlet, TeamsComponent, TypechartComponent],
})
export class AppComponent {
  title = 'DraftZone';
  teams: Team[] = draftTeamList;
  team = draftTeamList[2];
}
