
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeambuilderComponent } from './old/teambuilder-pokemon.component';
import { PokemonSet } from './pokemon-builder.model';

@Component({
  selector: 'teambuilder-analyzer',
  templateUrl: './teambuilder.component.html',
  imports: [RouterModule, FormsModule, TeambuilderComponent],
})
export class TeamBuilderComponent implements OnInit {
  ruleset: string | null = null;
  format: string | null = null;
  team: PokemonSet[] = [];

  ngOnInit(): void {
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
