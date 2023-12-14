import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../../pokemon';

@Component({
  selector: 'speedchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speedchart.component.html'
})
export class SpeedchartComponent {

  @Input() myTeam!: Pokemon[];
  @Input() oppTeam!: Pokemon[];
}
