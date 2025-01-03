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
    MatSortModule,
  ],
})
export class SetAnalyzerComponent implements OnInit {
  patList: { rank: number; pokemon: Pokemon }[] = [];
  selectedOpponent: Pokemon | undefined;

  constructor(private teambuilderService: TeambuilderService) {}

  ngOnInit(): void {
    this.teambuilderService.getPatsList().subscribe((data) => {
      this.patList = data.map((pokemon, index) => ({
        rank: index + 1,
        pokemon: pokemon,
      }));
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
}
