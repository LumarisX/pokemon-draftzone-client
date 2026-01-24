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
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { IconComponent } from '../../../../images/icon/icon.component';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { DraftPokemon } from '../../../../interfaces/draft';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import {
  PokemonBuilder,
  PokemonData,
  PokemonJson,
} from './pokemon-builder/pokemon-builder.model';
import { MatchupData } from '../../matchup-interface';
import {
  MatchupPokemonBuilderComponent,
  PokemonBuilderView,
} from './pokemon-builder/pokemon-builder.component';
import { isPokemon, Pokemon } from '../../../../interfaces/pokemon';

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
  team!: PokemonBuilder[];
  @Output() closePanel = new EventEmitter<void>();

  private teambuilderService = inject(TeambuilderService);
  private saveTeamSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  LOCAL_STORAGE_TEAM_KEY = 'matchup_teambuilder';

  tab: Tab = 'add';
  view: PokemonBuilderView = 'details';

  ngOnInit() {
    this.saveTeamSubject
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => this.performSaveTeam());

    this.loadTeam();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.saveTeamSubject.complete();
  }

  loadTeam() {
    this.team = [];
    const existing = localStorage.getItem(this.LOCAL_STORAGE_TEAM_KEY);
    if (existing) {
      const teamData = JSON.parse(existing);
      if (teamData[this.matchupId]) {
        const savedTeam = teamData[this.matchupId].team;
        savedTeam.forEach((pokemonJson: PokemonJson) => {
          this.teambuilderService
            .getPokemonData(pokemonJson.id, this.matchupData.details.ruleset)
            .pipe(takeUntil(this.destroy$))
            .subscribe((pokemonData) => {
              this.team.push(PokemonBuilder.fromJson(pokemonJson, pokemonData));
            });
        });
      }
    }
  }

  addPokemonToTeam(
    pokemon: DraftPokemon,
    then: ((pokemon: Pokemon<PokemonData>) => void) | null = null,
  ) {
    this.teambuilderService
      .getPokemonData(pokemon.id, this.matchupData.details.ruleset)
      .pipe(takeUntil(this.destroy$))
      .subscribe((pokemonData) => {
        const pokemonSet = PokemonBuilder.fromTeambuilder(pokemonData, {
          shiny: pokemon.shiny,
          nickname: pokemon.nickname,
          level: this.matchupData.details.level,
        });
        this.team.push(pokemonSet);
        this.saveTeamSubject.next();
        if (then) then(pokemonData);
      });
  }

  addPokemonToTeamAndSelect(pokemon: DraftPokemon) {
    const teamIndex = this.team.length;
    this.addPokemonToTeam(pokemon, () => {
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
    this.saveTeamSubject.next();

    // Adjust active tab if needed
    if (typeof this.tab === 'number') {
      if (this.tab >= this.team.length && this.team.length > 0) {
        this.tab = this.team.length - 1;
      } else if (this.team.length === 0) {
        this.tab = 'add';
      }
    }
  }

  formatTeamForStorage(): {} {
    return {
      team: this.team.map((pokemonSet) => pokemonSet.toJson()),
    };
  }

  saveTeam() {
    this.saveTeamSubject.next();
  }

  private performSaveTeam() {
    const existing = localStorage.getItem(this.LOCAL_STORAGE_TEAM_KEY);
    const teamData = existing ? JSON.parse(existing) : {};
    teamData[this.matchupId] = this.formatTeamForStorage();
    localStorage.setItem(this.LOCAL_STORAGE_TEAM_KEY, JSON.stringify(teamData));
  }
}
