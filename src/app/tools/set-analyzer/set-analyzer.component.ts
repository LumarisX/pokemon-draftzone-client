import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSortModule, Sort } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import {
  setCalcs as SetCalcs,
  TeambuilderService,
} from '../../services/teambuilder.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { compare } from '../../util';
import { TeamBuilderPokemonComponent } from '../teambuilder/teambuilder-pokemon.component';
import { PokemonBuilder } from '../teambuilder/pokemon-builder.model';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'teambuilder-analyzer',
  standalone: true,
  templateUrl: './set-analyzer.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TeamBuilderPokemonComponent,
    SpriteComponent,
    MatIcon,
    MatButtonModule,
    MatSortModule,
  ],
})
export class SetAnalyzerComponent implements OnInit {
  private teambuilderService = inject(TeambuilderService);

  patList: { rank: number; pokemon: Pokemon; percent: number }[] = [];
  selectedOpponent: Pokemon | undefined;
  link: string | undefined;
  pokemonSet: PokemonBuilder | null = null;
  results: [SetCalcs, SetCalcs] | undefined;

  ngOnInit(): void {
    this.teambuilderService.getPatsList().subscribe((data) => {
      this.patList = data.map((pokemon, index) => ({
        rank: index + 1,
        pokemon: { name: pokemon.name, id: pokemon.id },
        percent: pokemon.percent,
      }));
      this.selectedOpponent = this.patList[0].pokemon;
    });
  }

  sortData(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return 0;
    }
    const isAsc = sort.direction === 'asc';
    this.patList.sort((a, b) => {
      switch (sort.active) {
        case 'name':
          return compare(a.pokemon.name, b.pokemon.name, isAsc);
        case 'num':
          return compare(a.rank, b.rank, isAsc);
      }
      return 0;
    });
    return 0;
  }

  calcMatchup() {
    if (this.selectedOpponent && this.pokemonSet?.set.toJson()) {
      this.teambuilderService
        .getPatsMatchup({
          set: btoa(JSON.stringify(this.pokemonSet?.set.toJson())),
          opp: this.selectedOpponent.name,
        })
        .subscribe((data) => {
          this.results = data?.results;
          this.link = data?.link;
        });
    }
  }
}
