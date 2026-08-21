import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SwapOpponentButton } from '@pdz/shared/buttons/swap-opponent/swap-opponent.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { TypechartCoreComponent } from '@pdz/shared/widgets/typechart/typechart-core/typechart-core.component';
import { TypestatsCoreComponent } from '@pdz/shared/widgets/typechart/typestats-core/typestats-core.component';
import { TypeChart, TypeChartPokemon } from '../../matchup-interface';

@Component({
  selector: 'pdz-typechart',
  templateUrl: './typechart.component.html',
  styleUrl: './typechart.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SlideToggleComponent,
    TypechartCoreComponent,
    TypestatsCoreComponent,
    SwapOpponentButton,
    WidgetComponent,
  ],
  host: {
    '[class.alternate]': 'shownTeam() === 1',
  },
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
