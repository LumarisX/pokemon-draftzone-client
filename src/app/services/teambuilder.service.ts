import { inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { StatsTable, TeraType } from '../data';
import { Pokemon } from '../interfaces/pokemon';
import {
  PokemonBuilder,
  PokemonSetData,
  PokemonData,
} from '../drafts/matchup-overview/widgets/teambuilder/pokemon-builder/pokemon-builder.model';
import { ApiService } from './api.service';
import { WebSocketService } from './ws.service';

export type setCalcs = {
  attacker: string;
  defender: string;
  calcs: {
    move: {
      name: string;
      type: string;
    };
    chance: string;
    n: number;
    min:
      | {
          chance: string;
          n: number;
          set: {
            ivs: StatsTable;
            evs: StatsTable;
            nature: string;
            ability?: string;
            item?: string;
          };
        }
      | undefined;
    max:
      | {
          chance: string;
          n: number;
          set: {
            ivs: StatsTable;
            evs: StatsTable;
            nature: string;
            ability?: string;
            item?: string;
          };
        }
      | undefined;
  }[];
};

@Injectable({
  providedIn: 'root',
})
export class TeambuilderService implements OnDestroy {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);
  private wsSubscription?: Subscription;
  private isConnected = false;

  private ensureConnected(): void {
    if (!this.isConnected) {
      this.wsSubscription = this.wsService.connect().subscribe({
        next: () => {
          this.isConnected = true;
          console.log('TeambuilderService: WebSocket connected');
        },
        error: (err) => {
          this.isConnected = false;
          console.error('TeambuilderService: WebSocket connection error', err);
        },
        complete: () => {
          this.isConnected = false;
          console.log('TeambuilderService: WebSocket disconnected');
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.wsSubscription?.unsubscribe();
    this.wsService.close();
    this.isConnected = false;
  }

  getPokemonData(
    id: string,
    ruleset: string,
  ): Observable<Pokemon<PokemonData>> {
    return this.apiService.get('teambuilder/pokemonData', false, {
      id,
      ruleset,
    });
  }

  getPatsList(): Observable<(Pokemon & { percent: number })[]> {
    return this.apiService.get('teambuilder/pats-list', false);
  }

  getPatsMatchup(data: {
    set: string;
    opp: string;
  }): Observable<{ link: string; results: [setCalcs, setCalcs] } | undefined> {
    return this.apiService.get('teambuilder/pats-matchup', false, data);
  }

  getMoveCalculations(params: {
    attacker: PokemonSetData;
    target: PokemonSetData;
  }): Observable<setCalcs> {
    this.ensureConnected();
    return this.wsService.sendMessage<setCalcs>('move.calculations', params);
  }

  getPokemonLearnset(pokemon: PokemonBuilder, ruleset: string) {
    this.ensureConnected();
    return this.wsService.sendMessage<
      {
        id: string;
        name: string;
        type: TeraType;
        category: 'Physical' | 'Special' | 'Status';
        basePower: number;
        accuracy: number | true;
        modified?: { basePower?: true; accuracy?: true; type?: true };
        pp: number;
        desc: string;
        tags: string[];
        isStab: boolean;
        strength: number;
      }[]
    >('teambuilder.getProcessedLearnset', {
      ruleset: ruleset,
      pokemon: {
        id: pokemon.id,
        types: pokemon.types,
        teraType: pokemon.teraType,
        ability: pokemon.ability,
        moves: pokemon.moves,
        happiness: pokemon.happiness,
        item: pokemon.item,
        evs: pokemon.evs,
        ivs: pokemon.ivs,
        boosts: pokemon.boosts,
        nature: pokemon.nature.name,
      },
    });
  }
}
