import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TeambuilderService } from '../../api/teambuilder.service';
import { NATURES, STATS, TERATYPES } from '../../data';
import { nameList } from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { PokemonSelectComponent } from '../../util/pokemon-select/pokemon-select.component';
import { PokemonBuilder, TeambuilderPokemon } from './pokemon-builder.model';

@Component({
  selector: 'teambuilder-pokemon',
  standalone: true,
  templateUrl: './teambuilder-pokemon.component.html',
  styleUrl: './teambuilder-pokemon.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SelectSearchComponent,
    MatTabsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatFormFieldModule,
    PokemonSelectComponent,
  ],
})
export class TeamBuilderPokemonComponent {
  private _pokemon: PokemonBuilder | null = null;
  selectedPokemon: Pokemon | null = null;
  @Input() showBoosts: boolean = false;
  @Input() set pokemon(value: Pokemon | null) {
    if (value === null) {
      this._pokemon = null;
      return;
    }
    this.teambuilderService
      .getPokemonData(value.id, 'Gen9 NatDex')
      .subscribe((data: TeambuilderPokemon) => {
        this._pokemon = new PokemonBuilder(data);
      });
  }
  get pokemon(): PokemonBuilder | null {
    return this._pokemon;
  }

  names = nameList();
  teraTypes = TERATYPES;
  natures = NATURES;
  stats = STATS;
  tab: 'main' | 'moves' | 'stats' | 'inout' = 'main';

  constructor(private teambuilderService: TeambuilderService) {}

  import(data: string) {
    // PokemonSet.importSet(data);
    console.log(data);
  }

  setPokemon() {}
}
