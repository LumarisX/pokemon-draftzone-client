import { CommonModule } from '@angular/common';
import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { CoverageChart, TypeChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';
import { ResetSVG } from '../../../images/svg-components/reset.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, CoverageComponent, ResetSVG],
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
    if (this.selectedTeam > 0 == inverted) return 'bg-aTeam-300';
    return 'bg-bTeam-300';
  }

  clickColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted)
      return 'bg-aTeam-300 hover:bg-aTeam-300';
    return 'bg-bTeam-300 hover:bg-bTeam-300';
  }

  @ViewChildren(CoverageComponent)
  coverageComponents!: QueryList<CoverageComponent>;

  updateAllCoverage() {
    this.coverageComponents.forEach((component) =>
      component.resetRecommended(),
    );
  }
}
