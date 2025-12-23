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
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { Pokemon } from '../../../../interfaces/draft';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import { PokemonSet } from '../../../../tools/teambuilder/pokemon-builder.model';
import { MatchupData } from '../../matchup-interface';
import { MatchupPokemonBuilderComponent } from './pokemon-builder/pokemon-builder.component';
import { PokemonBuilderView } from './pokemon-builder/pokemon-builder.component';
import { IconComponent } from '../../../../images/icon/icon.component';

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
  @Input({ required: true }) team!: PokemonSet[];
  @Output() closePanel = new EventEmitter<void>();

  private teambuilderService = inject(TeambuilderService);

  tab: Tab = 'add';
  view: PokemonBuilderView = 'details';

  ngOnInit() {
    this.addPokemonToTeamAndSelect(this.matchupData.summary[0].team[0]);
  }

  ngOnDestroy() {}

  addPokemonToTeamAndSelect(pokemon: Pokemon) {
    const teamIndex = this.team.length;
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .subscribe((pokemonData) => {
        const pokemonSet = PokemonSet.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
        this.tab = teamIndex;
      });
  }

  isPokemonInTeam(pokemon: Pokemon): boolean {
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
}
