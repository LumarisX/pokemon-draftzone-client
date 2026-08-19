import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TypechartCoreComponent } from '@pdz/shared/widgets/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '@pdz/shared/widgets/typechart/typestats-core/typestats-core.component';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';

@Component({
  selector: 'pdz-planner-typechart',
  templateUrl: './typechart.component.html',
  styleUrl: './typechart.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    TypechartCoreComponent,
    TypestatsCoreComponent,
  ],
})
export class PlannerTypechartComponent {
  readonly typechart = input<TypeChart>();

  abilities: boolean = true;
}
