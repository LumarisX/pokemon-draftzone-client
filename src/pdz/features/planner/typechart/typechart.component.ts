import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { TypechartCoreComponent } from '@pdz/shared/widgets/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '@pdz/shared/widgets/typechart/typestats-core/typestats-core.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';

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
    WidgetComponent,
  ],
})
export class PlannerTypechartComponent {
  readonly typechart = input<TypeChart>();

  abilities: boolean = true;
}
