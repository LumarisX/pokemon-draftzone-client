import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TypechartCoreComponent } from '../../../../util/matchup/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '../../../../util/matchup/typechart/typestats-core/typestatscore.component';
import { TypeChart } from '../../matchup-interface';

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  styleUrls: ['./typechart.component.scss', '../matchup.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    TypechartCoreComponent,
    TypestatsCoreComponent,
  ],
})
export class TypechartComponent {
  @Input()
  typecharts: TypeChart[] = [];
  abilities: boolean = true;
  opponent: boolean = false;
}
