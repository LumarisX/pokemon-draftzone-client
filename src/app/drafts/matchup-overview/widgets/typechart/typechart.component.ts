
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TypechartCoreComponent } from '../../../../util/matchup/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '../../../../util/matchup/typechart/typestats-core/typestats-core.component';
import { TypeChart } from '../../matchup-interface';
import { SwapOpponentButton } from '../../../../util/buttons/swap-opponent/swap-opponent.component';

@Component({
  selector: 'pdz-typechart',
  templateUrl: './typechart.component.html',
  styleUrls: ['./typechart.component.scss', '../../matchup.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    TypechartCoreComponent,
    TypestatsCoreComponent,
    SwapOpponentButton
],
})
export class TypechartComponent {
  @Input()
  typecharts: TypeChart[] = [];
  abilities: boolean = true;
  opponent: boolean = true;
}
