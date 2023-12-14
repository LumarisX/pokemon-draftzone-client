import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../../pokemon';

@Component({
  selector: 'summery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summery.component.html'
})
export class SummeryComponent {

  @Input() myTeam!: Pokemon[];
  @Input() oppTeam!: Pokemon[];
}
