import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSortModule, Sort } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { TeambuilderService } from '../../api/teambuilder.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { compare } from '../../util';
import { TeamBuilderPokemonComponent } from '../teambuilder/teambuilder-pokemon.component';
import { PokemonBuilder } from '../teambuilder/pokemon-builder.model';
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule,
    MatSortModule,
  ],
})
export class SetAnalyzerComponent implements OnInit {
  patList: { rank: number; pokemon: Pokemon; percent: number }[] = [];
  selectedOpponent: Pokemon | undefined;
  pokemonSet: PokemonBuilder | null = null;

  constructor(private teambuilderService: TeambuilderService) {}

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
      console.log({
        set: btoa(JSON.stringify(this.pokemonSet?.set.toJson())),
        opp: this.selectedOpponent.name,
      });
      this.teambuilderService
        .getPatsMatchup({
          set: btoa(JSON.stringify(this.pokemonSet?.set.toJson())),
          opp: this.selectedOpponent.name,
        })
        .subscribe((data) => {
          console.log(data);
        });
    } else {
      this.teambuilderService
        .getPatsMatchup({
          set: 'eyJuYW1lIjoiUHJpbWFyaW5hIiwiaXZzIjp7fSwiZXZzIjp7ImhwIjoyNTIsInNwYSI6MjUyfSwiaXRlbSI6IlRocm9hdCBTcHJheSIsImxldmVsIjo1MCwidGVyYVR5cGUiOiJXYXRlciIsIm1vdmVzIjpbIk1vb25ibGFzdCIsIkh5cGVyIFZvaWNlIiwiSWN5IFdpbmQiXSwiYWJpbGl0eSI6IkxpcXVpZCBWb2ljZSJ9',
          opp: 'Archaludon',
        })
        .subscribe((data) => {
          console.log(data);
        });
    }
  }
}
