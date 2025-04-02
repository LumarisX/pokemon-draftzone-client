import { CommonModule } from '@angular/common';
import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '../../../../util/buttons/swap-opponent/swap-opponent.component';
import { CoverageChart, TypeChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [
    CommonModule,
    CoverageComponent,
    SwapOpponentButton,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './coveragechart.component.html',
  styleUrls: ['../../matchup.scss', './coveragechart.component.scss'],
})
export class CoveragechartComponent {
  @Input() coverage!: CoverageChart[][];
  @Input() typecharts!: TypeChart[];
  opponent: boolean = false;
  get selectedTeam(): number {
    return this.opponent ? 1 : 0;
  }

  constructor() {}

  @ViewChildren(CoverageComponent)
  coverageComponents!: QueryList<CoverageComponent>;
}
