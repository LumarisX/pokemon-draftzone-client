import { Injectable } from '@angular/core';
import { PokemonId } from '../pokemon';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class PlannerService {
  constructor(private apiService: ApiService) {}

  getPlannerDetails(team: PokemonId[]) {
    return this.apiService.getUnauth('planner?team=' + team);
  }
}
