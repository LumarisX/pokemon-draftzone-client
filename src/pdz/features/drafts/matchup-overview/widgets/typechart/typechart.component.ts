import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { TypechartCoreComponent } from '@pdz/shared/widgets/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '@pdz/shared/widgets/typechart/typestats-core/typestats-core.component';
import { TypeChart, TypeChartPokemon } from '../../matchup-interface';

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
    SwapOpponentButton,
  ],
})
export class TypechartComponent {
  readonly typecharts = input.required<TypeChart[]>();
  abilities: boolean = true;
  readonly shownTeam = signal(1);
  @Output()
  togglePokemon = new EventEmitter<TypeChartPokemon>();

  onToggle(pokemon: TypeChartPokemon) {
    this.togglePokemon.emit(pokemon);
  }
}
