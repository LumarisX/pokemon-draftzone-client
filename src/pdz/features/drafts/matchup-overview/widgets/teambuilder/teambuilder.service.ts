import { inject, Injectable, OnDestroy } from '@angular/core';
import { from, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { StatsTable, TeraType } from '@pdz/shared/data';
import { Pokemon } from '@pdz/core/utils/pokemon';
import {
  PokemonBuilder,
  PokemonSetData,
  PokemonData,
} from '@pdz/features/drafts/matchup-overview/widgets/teambuilder/pokemon-builder/pokemon-builder.model';
import { ApiService } from '@pdz/core/services/api.service';
import { environment } from '@pdz/environments/environment';

const WS_REQUEST_TIMEOUT_MS = 10000;

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
  private socket?: Socket;

  private getSocket(): Socket {
    if (!this.socket) {
      const serverUrl = `${environment.tls ? 'wss' : 'ws'}://${environment.apiUrl}/teambuilder`;
      this.socket = io(serverUrl, { path: '/ws/' });
    }
    return this.socket;
  }

  ngOnDestroy(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }

  getPokemonData(
    id: string,
    ruleset: string,
  ): Observable<Pokemon<PokemonData>> {
    return this.apiService.get('teambuilder/pokemonData', {
      params: {
        id,
        ruleset,
      },
    });
  }

  getPatsList(): Observable<(Pokemon & { percent: number })[]> {
    return this.apiService.get('teambuilder/pats-list');
  }

  getPatsMatchup(data: {
    set: string;
    opp: string;
  }): Observable<{ link: string; results: [setCalcs, setCalcs] } | undefined> {
    return this.apiService.get('teambuilder/pats-matchup', { params: data });
  }

  getMoveCalculations(params: {
    attacker: PokemonSetData;
    target: PokemonSetData;
  }): Observable<setCalcs> {
    return from(
      this.getSocket()
        .timeout(WS_REQUEST_TIMEOUT_MS)
        .emitWithAck('move.calculations', params),
    ) as Observable<setCalcs>;
  }

  getPokemonLearnset(pokemon: PokemonBuilder, ruleset: string) {
    return from(
      this.getSocket()
        .timeout(WS_REQUEST_TIMEOUT_MS)
        .emitWithAck('getProcessedLearnset', {
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
        }),
    ) as Observable<
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
    >;
  }
}
