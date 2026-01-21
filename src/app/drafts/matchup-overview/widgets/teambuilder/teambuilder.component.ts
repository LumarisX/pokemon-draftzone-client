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
import { forkJoin } from 'rxjs';
import { IconComponent } from '../../../../images/icon/icon.component';
import { SpriteComponent } from '../../../../images/sprite/sprite.component';
import { DraftPokemon } from '../../../../interfaces/draft';
import { TeambuilderService } from '../../../../services/teambuilder.service';
import { PokemonBuilder, Move } from './pokemon-builder/pokemon-builder.model';
import { MatchupData } from '../../matchup-interface';
import {
  MatchupPokemonBuilderComponent,
  PokemonBuilderView,
} from './pokemon-builder/pokemon-builder.component';
import { NATURES } from '../../../../data';

type Tab = number | 'add' | 'export';

interface SerializedPokemon {
  id: string;
  name: string;
  nickname: string;
  shiny: boolean;
  level: number;
  nature: string;
  item: string | null;
  teraType: string;
  gender: '' | 'M' | 'F';
  happiness: number;
  dynamaxLevel: number;
  gigantamax: boolean;
  ability: string;
  moves: (Move | null)[];
  stats: {
    hp: { ivs: number; evs: number; boosts: number };
    atk: { ivs: number; evs: number; boosts: number };
    def: { ivs: number; evs: number; boosts: number };
    spa: { ivs: number; evs: number; boosts: number };
    spd: { ivs: number; evs: number; boosts: number };
    spe: { ivs: number; evs: number; boosts: number };
  };
}

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
  private saveInterval?: number;

  tab: Tab = 'add';
  view: PokemonBuilderView = 'details';

  private get storageKey(): string {
    return `teambuilder_${this.matchupId}`;
  }

  ngOnInit() {
    this.loadTeamFromStorage();
    // Auto-save every 5 seconds to capture form changes while minimizing performance impact
    this.saveInterval = window.setInterval(() => {
      this.saveTeamToStorage();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.saveTeamToStorage();
  }

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
        this.saveTeamToStorage();
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

  // Public method to save team changes (can be called from child components or on blur events)
  saveTeam(): void {
    this.saveTeamToStorage();
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

    this.saveTeamToStorage();
  }

  private saveTeamToStorage(): void {
    try {
      const teamData = this.team.map(pokemon => this.serializePokemon(pokemon));
      localStorage.setItem(this.storageKey, JSON.stringify(teamData));
    } catch (error) {
      console.error('Failed to save team to localStorage:', error);
    }
  }

  private loadTeamFromStorage(): void {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const teamData = JSON.parse(savedData);
        this.restoreTeamFromData(teamData);
      } else {
        // Use default: add first pokemon from team
        this.addPokemonToTeamAndSelect(this.matchupData.summary[0].team[0]);
      }
    } catch (error) {
      console.error('Failed to load team from localStorage:', error);
      // Fallback to default
      this.addPokemonToTeamAndSelect(this.matchupData.summary[0].team[0]);
    }
  }

  private serializePokemon(pokemon: PokemonBuilder): SerializedPokemon {
    return {
      id: pokemon.id,
      name: pokemon.name,
      nickname: pokemon.nickname,
      shiny: pokemon.shiny,
      level: pokemon.level,
      nature: pokemon.nature.name,
      item: pokemon.item,
      teraType: pokemon.teraType,
      gender: pokemon.gender,
      happiness: pokemon.happiness,
      dynamaxLevel: pokemon.dynamaxLevel,
      gigantamax: pokemon.gigantamax,
      ability: pokemon.ability,
      moves: pokemon.moves.map(move => move ? {
        id: move.id,
        name: move.name,
        type: move.type,
        category: move.category,
        basePower: move.basePower,
        accuracy: move.accuracy,
        pp: move.pp,
        desc: move.desc,
        isStab: move.isStab,
        strength: move.strength,
        tags: move.tags,
        modified: move.modified
      } : null),
      stats: {
        hp: { ivs: pokemon.stats.hp.ivs, evs: pokemon.stats.hp.evs, boosts: pokemon.stats.hp.boosts },
        atk: { ivs: pokemon.stats.atk.ivs, evs: pokemon.stats.atk.evs, boosts: pokemon.stats.atk.boosts },
        def: { ivs: pokemon.stats.def.ivs, evs: pokemon.stats.def.evs, boosts: pokemon.stats.def.boosts },
        spa: { ivs: pokemon.stats.spa.ivs, evs: pokemon.stats.spa.evs, boosts: pokemon.stats.spa.boosts },
        spd: { ivs: pokemon.stats.spd.ivs, evs: pokemon.stats.spd.evs, boosts: pokemon.stats.spd.boosts },
        spe: { ivs: pokemon.stats.spe.ivs, evs: pokemon.stats.spe.evs, boosts: pokemon.stats.spe.boosts },
      }
    };
  }

  private restoreTeamFromData(teamData: SerializedPokemon[]): void {
    // Use forkJoin to wait for all Pokemon data to load before adding to team
    // This prevents race conditions and ensures Pokemon are added in the correct order
    const pokemonObservables = teamData.map(pokemonData =>
      this.teambuilderService.getPokemonData(pokemonData.id, this.matchupData.details.ruleset)
    );

    if (pokemonObservables.length === 0) {
      return;
    }

    forkJoin(pokemonObservables).subscribe({
      next: (fullPokemonDataArray) => {
        fullPokemonDataArray.forEach((fullPokemonData, index) => {
          const pokemonData = teamData[index];
          // Find the nature by name
          const nature = NATURES.find(n => n.name === pokemonData.nature) || NATURES[0];
          
          const pokemonSet = PokemonBuilder.fromTeambuilder(fullPokemonData, {
            shiny: pokemonData.shiny,
            nickname: pokemonData.nickname,
            level: pokemonData.level,
            nature: nature,
            item: pokemonData.item,
            teraType: pokemonData.teraType as any, // Type assertion for stored string to TeraType
            gender: pokemonData.gender,
            happiness: pokemonData.happiness,
            dynamaxLevel: pokemonData.dynamaxLevel,
            gigantamax: pokemonData.gigantamax,
            ability: pokemonData.ability,
            moves: pokemonData.moves,
            stats: pokemonData.stats as any // Type assertion for stats - constructor will properly initialize
          });
          this.team.push(pokemonSet);
        });
      },
      error: (err) => {
        console.error('Failed to restore team from storage:', err);
        // Fallback to default if restoration fails
        this.addPokemonToTeamAndSelect(this.matchupData.summary[0].team[0]);
      }
    });
  }
}
