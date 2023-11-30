import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../team';

@Component({
  selector: 'summery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summery.component.html',
  styleUrl: './summery.component.css'
})
export class SummeryComponent {
  
  @Input() team!: Team;
}
