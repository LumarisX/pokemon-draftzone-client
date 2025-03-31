import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';
import { TypechartCoreComponent } from '../../util/matchup/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '../../util/matchup/typechart/typestats-core/typestatscore.component';

@Component({
  selector: 'planner-typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  styleUrl: './typechart.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    TypechartCoreComponent,
    TypestatsCoreComponent,
  ],
})
export class PlannerTypechartComponent {
  @Input()
  typechart?: TypeChart;

  abilities: boolean = true;
}
