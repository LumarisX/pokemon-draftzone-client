import { Component, inject, Input, OnInit } from '@angular/core';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { MatchupData, TypeChartPokemon } from '../matchup-interface';
import { TeambuilderWidgetComponent } from '../widgets/teambuilder/teambuilder.component';
import { PokemonSet } from '../../../tools/teambuilder/pokemon-builder.model';
import { TypechartComponent } from '../widgets/typechart/typechart.component';
import { Pokemon } from '../../../interfaces/draft';
import { TeambuilderService } from '../../../services/teambuilder.service';
import { CoverageComponent } from '../widgets/coveragechart/coveragechart.component';

@Component({
  selector: 'pdz-matchup-teambuilder',
  templateUrl: './matchup-teambuilder.component.html',
  styleUrl: './matchup-teambuilder.component.scss',
  imports: [
    LoadingComponent,
    TeambuilderWidgetComponent,
    TypechartComponent,
    CoverageComponent,
  ],
})
export class MatchupTeambuilderComponent implements OnInit {
  @Input({ required: true })
  matchupId!: string;
  @Input({ required: true })
  matchupData!: MatchupData;

  team: PokemonSet[] = [];
  private teambuilderService = inject(TeambuilderService);

  ngOnInit() {
    this.loadTeam();
  }

  loadTeam() {
    this.addPokemonToTeam(this.matchupData.summary[0].team[5]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[4]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[3]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[7]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[0]);
    this.addPokemonToTeam(this.matchupData.summary[0].team[9]);
  }

  getTypechart() {
    const typechart = this.matchupData.typechart[0];
    return [
      {
        ...typechart,
        team: typechart.team.map((t) => {
          const p = this.team.find((p) => p.id === t.id);
          return {
            ...t,
            ...p,
            disabled: !p,
          };
        }),
      },
    ];
  }

  onToggle(pokemon: TypeChartPokemon) {
    if (!pokemon.disabled) {
      this.addPokemonToTeam(pokemon);
    } else {
      this.removePokemonFromTeam(pokemon);
    }
  }

  addPokemonToTeam(pokemon: Pokemon) {
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        console.log(pokemonData);
        const pokemonSet = PokemonSet.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
      });
  }

  removePokemonFromTeam(pokemon: Pokemon) {
    this.team = this.team.filter((p) => p.id !== pokemon.id);
  }
}
