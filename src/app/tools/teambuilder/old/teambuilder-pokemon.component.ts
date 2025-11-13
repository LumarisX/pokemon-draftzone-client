import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { NATURES, STATS, TERATYPES } from '../../../data';
import { nameList } from '../../../data/namedex';
import { Pokemon } from '../../../interfaces/draft';
import { TeambuilderService } from '../../../services/teambuilder.service';
import { PokemonSelectComponent } from '../../../util/pokemon-select/pokemon-select.component';
import { PokemonSet, TeambuilderPokemon } from '../pokemon-builder.model';

@Component({
  selector: 'pdz-teambuilder-core',
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
  ],
})
export class TeambuilderComponent {
  private teambuilderService = inject(TeambuilderService);

  private _pokemon: PokemonSet | null = null;
  selectedPokemon: Pokemon | null = null;
  @Input()
  ruleset: string | null = null;
  @Input()
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
        this._pokemon = PokemonSet.fromTeambuilder(data);
        this.builderSet.emit(this._pokemon);
      });
  }
  get pokemon(): PokemonSet | null {
    return this._pokemon;
  }

  @Output()
  builderSet: EventEmitter<PokemonSet | null> = new EventEmitter();

  names = nameList();
  teraTypes = TERATYPES;
  natures = NATURES;
  stats = STATS;
  tab: 'main' | 'moves' | 'stats' | 'inout' = 'main';

  import(data: string) {
    console.log(data);
  }

  displayName(value: any) {
    return value?.name ?? '';
  }
}
