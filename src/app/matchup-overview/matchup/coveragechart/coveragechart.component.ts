import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoverageChart, TypeChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, CoverageComponent, SpriteComponent],
  templateUrl: './coveragechart.component.html',
})
export class CoveragechartComponent {
  @Input() coverage!: CoverageChart[][];
  @Input() typecharts!: TypeChart[];
  selectedTeam: number = 0;

  constructor() {}

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.coverage.length;
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
