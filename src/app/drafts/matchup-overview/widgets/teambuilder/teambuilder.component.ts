import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { IconComponent } from '../../../../images/icon/icon.component';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { DraftPokemon } from '../../../../interfaces/draft';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import { PokemonBuilder } from './pokemon-builder/pokemon-builder.model';
import { MatchupData } from '../../matchup-interface';
import {
  MatchupPokemonBuilderComponent,
  PokemonBuilderView,
} from './pokemon-builder/pokemon-builder.component';

type Tab = number | 'add' | 'export';

@Component({
  selector: 'pdz-matchup-teambuilder',
  templateUrl: './teambuilder.component.html',
  styleUrls: ['./teambuilder.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    MatIconModule,
    MatchupPokemonBuilderComponent,
    IconComponent,
  ],
})
export class MatchupTeambuilderComponent implements OnInit, OnDestroy {
  @Input({ required: true }) matchupId!: string;
  @Input({ required: true }) matchupData!: MatchupData;
  @Input({ required: true }) team!: PokemonBuilder[];
  @Output() closePanel = new EventEmitter<void>();

  private teambuilderService = inject(TeambuilderService);

  tab: Tab = 'add';
  view: PokemonBuilderView = 'details';

  ngOnInit() {
    this.addPokemonToTeamAndSelect(this.matchupData.summary[0].team[0]);
  }

  ngOnDestroy() {}

  addPokemonToTeamAndSelect(pokemon: DraftPokemon) {
    const teamIndex = this.team.length;
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        const pokemonSet = PokemonBuilder.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
        this.tab = teamIndex;
      });
  }

  isPokemonInTeam(pokemon: DraftPokemon): boolean {
    return this.team.some((teamMon) => teamMon.id === pokemon.id);
  }

  selectTab(tab: Tab, event?: Event) {
    if (event) {
      if (event instanceof KeyboardEvent) {
        event.preventDefault();
      }
      event.stopPropagation();
    }
    this.tab = tab;
  }

  exportTeam(): string {
    return this.team.map((pokemonSet) => pokemonSet.export()).join('\n');
  }

  deletePokemon(index: number, event: Event) {
    event.stopPropagation();
    this.team.splice(index, 1);

    // Adjust active tab if needed
    if (typeof this.tab === 'number') {
      if (this.tab >= this.team.length && this.team.length > 0) {
        this.tab = this.team.length - 1;
      } else if (this.team.length === 0) {
        this.tab = 'add';
      }
    }
  }
}
