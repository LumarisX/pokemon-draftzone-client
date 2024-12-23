import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { PokemonBuilder } from './pokemon-builder.model';
import { NATURES, StatsTable } from '../../data';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'teambuilder-pokemon',
  standalone: true,
  templateUrl: './teambuilder-pokemon.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    SelectSearchComponent,
    SelectNoSearchComponent,
    MatTabsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
  ],
})
export class TeamBuilderPokemonComponent {
  @Input() pokemon!: PokemonBuilder;
  natures = Object.entries(NATURES).map((nature) => ({
    name: nature[1].name,
    value: nature[0],
    drop:
      nature[1].drop === nature[1].boost ? '-' : nature[1].drop.toUpperCase(),
    boost:
      nature[1].drop === nature[1].boost ? '-' : nature[1].boost.toUpperCase(),
  }));
  stats: (keyof StatsTable)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  tab: 'main' | 'moves' | 'stats' | 'inout' = 'main';
}
