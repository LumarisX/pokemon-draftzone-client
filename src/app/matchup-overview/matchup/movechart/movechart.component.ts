import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { MoveChart } from '../../matchup-interface';

@Component({
  selector: 'movechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './movechart.component.html',
})
export class MovechartComponent {
  @Input() teams!: MoveChart[];
  selectedTeam: number = 1;

  constructor() {}

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-cyan-400';
    return 'bg-red-400';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-cyan-400 hover:bg-cyan-300';
    return 'bg-red-400 hover:bg-red-300';
  }
}
