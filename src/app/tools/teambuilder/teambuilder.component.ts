import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { TeambuilderService } from '../../api/teambuilder.service';
import { nameList } from '../../data/namedex';
import { PokemonBuilder } from './pokemon-builder.model';
import { TeamBuilderPokemonComponent } from './teambuilder-pokemon.component';

@Component({
  selector: 'teambuilder-analyzer',
  standalone: true,
  templateUrl: './teambuilder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TeamBuilderPokemonComponent,
  ],
})
export class TeamBuilderComponent implements OnInit {
  team: PokemonBuilder[] = [];
  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  names = nameList();

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
    // this.addPokemon({ name: 'Deoxys', id: 'deoxys' });
  }

  // addPokemon(pokemon: Pokemon | null) {
  //   if (pokemon)
  //     this.teambuilderService
  //       .getPokemonData(pokemon.id, 'Gen9 NatDex')
  //       .subscribe((data: TeambuilderPokemon) => {
  //         this.team.push(new PokemonBuilder(data));
  //       });
  // }
}
