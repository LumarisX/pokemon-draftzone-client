import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { TypechartCoreComponent } from '@pdz/shared/widgets/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '@pdz/shared/widgets/typechart/typestats-core/typestats-core.component';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';
import { PlannerWidgetComponent } from '../widget/planner-widget.component';

@Component({
  selector: 'pdz-planner-typechart',
  templateUrl: './typechart.component.html',
  styleUrl: './typechart.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SlideToggleComponent,
    TypechartCoreComponent,
    TypestatsCoreComponent,
    PlannerWidgetComponent,
  ],
})
export class PlannerTypechartComponent {
  @Input()
  typechart?: TypeChart;

  abilities: boolean = true;
}
