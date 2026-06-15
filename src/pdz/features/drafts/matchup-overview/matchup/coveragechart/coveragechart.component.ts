import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { CoverageChart, TypeChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';

@Component({
  selector: 'pdz-coveragechart',
  imports: [
    CoverageComponent,
    SwapOpponentButton,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './coveragechart.component.html',
  styleUrls: ['../../matchup.scss', './coveragechart.component.scss'],
})
export class CoveragechartComponent {
  @Input() coverage!: CoverageChart[][];
  @Input() typecharts!: TypeChart[];
  opponent: boolean = false;
  abilities: boolean = true;
  get selectedTeam(): number {
    return this.opponent ? 1 : 0;
  }

  constructor() {}

  @ViewChildren(CoverageComponent)
  coverageComponents!: QueryList<CoverageComponent>;
}
