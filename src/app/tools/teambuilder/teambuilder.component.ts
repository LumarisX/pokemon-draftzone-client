import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeambuilderService } from '../../services/teambuilder.service';
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
  private teambuilderService = inject(TeambuilderService);

  team: PokemonBuilder[] = [];

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
