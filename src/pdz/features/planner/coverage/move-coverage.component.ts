import { Component, Input } from '@angular/core';
import { getNameByPid } from '@pdz/shared/data/namedex';
import {
  Coverage,
  CoveragePokemon,
} from '../../drafts/matchup-overview/matchup-interface';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { CoverageChartComponent } from './charts/coverage-chart.component';

@Component({
  selector: 'pdz-planner-move-coverage',
  templateUrl: './move-coverage.component.html',
  styleUrl: './move-coverage.component.scss',
  imports: [CoverageChartComponent, WidgetComponent],
})
export class PlannerMoveCoverageComponent {
  private _coverage: Coverage | null = null;

  @Input() set coverage(value: Coverage | null) {
    this._coverage = value;
    this.selected = value?.team[0] ?? null;
  }

  get coverage(): Coverage | null {
    return this._coverage;
  }

  selected: CoveragePokemon | null = null;

  nameOf(pokemon: CoveragePokemon): string {
    return getNameByPid(pokemon.id) || pokemon.id;
  }
}
