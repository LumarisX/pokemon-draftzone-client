import { Component, QueryList, ViewChildren, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { CoverageChart, TypeChart } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';

@Component({
  selector: 'pdz-coveragechart',
  imports: [
    CoverageComponent,
    SwapOpponentButton,
    FormsModule,
    ReactiveFormsModule,
    SlideToggleComponent,
    WidgetComponent,
  ],
  templateUrl: './coveragechart.component.html',
  styleUrl: './coveragechart.component.scss',
  host: {
    '[class.alternate]': 'opponent',
  },
})
export class CoveragechartComponent {
  readonly coverage = input.required<CoverageChart[][]>();
  readonly typecharts = input.required<TypeChart[]>();
  opponent: boolean = false;
  abilities: boolean = true;
  get selectedTeam(): number {
    return this.opponent ? 1 : 0;
  }

  @ViewChildren(CoverageComponent)
  coverageComponents!: QueryList<CoverageComponent>;
}
