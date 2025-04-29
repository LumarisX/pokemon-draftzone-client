import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TypeChart } from '../../drafts/matchup-overview/matchup-interface';
import { TypechartCoreComponent } from '../../util/matchup/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '../../util/matchup/typechart/typestats-core/typestats-core.component';

@Component({
  selector: 'pdz-planner-typechart',
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
