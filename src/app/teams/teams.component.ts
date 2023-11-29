import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../teams';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.css',
})
export class TeamsComponent {
  @Input() team!: Team;
}
