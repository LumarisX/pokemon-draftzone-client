import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { TeambuilderService } from '../../services/teambuilder.service';
import { NATURES, STATS, TERATYPES } from '../../data';
import { nameList } from '../../data/namedex';
import { Pokemon } from '../../interfaces/draft';
import { PokemonSelectComponent } from '../../util/pokemon-select/pokemon-select.component';
import { PokemonBuilder, TeambuilderPokemon } from './pokemon-builder.model';
import { MatSliderModule } from '@angular/material/slider';
import { RulesetSelectComponent } from '../../util/ruleset-select/ruleset.component';
import { FormatSelectComponent } from '../../util/format-select/format.component';

@Component({
  selector: 'teambuilder-pokemon',
  standalone: true,
  templateUrl: './teambuilder-pokemon.component.html',
  styleUrl: './teambuilder-pokemon.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSliderModule,
    MatFormFieldModule,
    PokemonSelectComponent,
    RulesetSelectComponent,
    FormatSelectComponent,
  ],
})
export class TeamBuilderPokemonComponent {
  private teambuilderService = inject(TeambuilderService);

  private _pokemon: PokemonBuilder | null = null;
  selectedPokemon: Pokemon | null = null;
  ruleset: string | null = null;
  format: string | null = null;

  @Input() showBoosts: boolean = false;
  @Input() set pokemon(value: Pokemon | null) {
    if (value === null) {
      this._pokemon = null;
      this.builderSet.emit(null);
      return;
    }
    if (!this.ruleset) return;
    this.teambuilderService
      .getPokemonData(value.id, this.ruleset)
      .subscribe((data: TeambuilderPokemon) => {
        this._pokemon = new PokemonBuilder(data);
        this.builderSet.emit(this._pokemon);
      });
  }
  get pokemon(): PokemonBuilder | null {
    return this._pokemon;
  }

  @Output()
  builderSet: EventEmitter<PokemonBuilder | null> = new EventEmitter();

  names = nameList();
  teraTypes = TERATYPES;
  natures = NATURES;
  stats = STATS;
  tab: 'main' | 'moves' | 'stats' | 'inout' = 'main';

  import(data: string) {
    // this._pokemon = PokemonBuilder.import(data)
    console.log(data);
  }

  displayName(value: any) {
    return value?.name ?? '';
  }
}
