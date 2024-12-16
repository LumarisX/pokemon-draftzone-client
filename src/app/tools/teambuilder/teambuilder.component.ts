import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { TeambuilderService } from '../../api/teambuilder.service';
import { NATURES, StatsTable } from '../../data';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { PokemonBuilder, TeambuilderPokemon } from './pokemon-builder.model';

@Component({
  selector: 'teambuilder-analyzer',
  standalone: true,
  templateUrl: './teambuilder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    SelectSearchComponent,
    SelectNoSearchComponent,
  ],
})
export class TeamBuilderComponent implements OnInit {
  team: PokemonBuilder[] = [];
  natures = Object.entries(NATURES).map((nature) => ({
    name:
      nature[1].boost === nature[1].drop
        ? nature[1].name
        : `${
            nature[1].name
          } +${nature[1].boost.toUpperCase()}/-${nature[1].drop.toUpperCase()}`,
    value: nature[0],
  }));
  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  stats: (keyof StatsTable)[] = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  names: { name: string; value: Pokemon }[] = nameList();

  constructor(
    private dataService: DataService,
    private teambuilderService: TeambuilderService,
  ) {}

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  addPokemon(pokemon: Pokemon | null) {
    if (pokemon)
      this.teambuilderService
        .getPokemonData(pokemon.id, 'Gen9 NatDex')
        .subscribe((data: TeambuilderPokemon) => {
          this.team.push(new PokemonBuilder(data));
        });
  }
}
