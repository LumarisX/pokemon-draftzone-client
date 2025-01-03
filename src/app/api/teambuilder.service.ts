import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TeambuilderPokemon } from '../tools/teambuilder/pokemon-builder.model';
import { Pokemon } from '../interfaces/draft';

@Injectable({
  providedIn: 'root',
})
export class TeambuilderService {
  constructor(private apiService: ApiService) {}

  getPokemonData(id: string, ruleset: string): Observable<TeambuilderPokemon> {
    return this.apiService.get('teambuilder/pokemonData', false, {
      id,
      ruleset,
    });
  }

  getPatsList(): Observable<Pokemon[]> {
    return this.apiService.get('teambuilder/pats-list', false);
  }
}
