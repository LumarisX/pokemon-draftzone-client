import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoverageChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, CoverageComponent, SpriteComponent],
  templateUrl: './coveragechart.component.html',
})
export class CoveragechartComponent {
  @Input() teams!: CoverageChart[][];
  selectedTeam: number = 0;

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
