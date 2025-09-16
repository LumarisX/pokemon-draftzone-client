import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Pokemon } from '../interfaces/draft';
import { ApiService } from './api.service';

export type RuleCategory = {
  header: string;
  details: string[];
};

@Injectable({
  providedIn: 'root',
})
export class LeagueDraftingService {
  private apiService = inject(ApiService);

  getDraftOrder(): Observable<
    {
      teamName: string;
      status?: string;
      pokemon?: Pokemon;
    }[][]
  > {
    return of([
      [
        {
          teamName: 'Mighty Murkrow',
          pokemon: { id: 'tapukoko', name: 'Tapu Koko' },
        },
        {
          teamName: 'Montreal Mean Mareanies',
          pokemon: { id: 'dragapult', name: 'Dragapult' },
        },
        {
          teamName: 'Philadelphia Flygons',
          pokemon: { id: 'latiosmega', name: 'Mega Latios' },
        },
        {
          teamName: 'London Vespiquens',
          pokemon: { id: 'ironvaliant', name: 'Iron Valiant' },
        },
        {
          teamName: 'Chicago White Fox',
          pokemon: { id: 'zamazenta', name: 'Zamazenta' },
        },
        {
          teamName: 'Victorious Vigoroths',
          pokemon: { id: 'landorustherian', name: 'Landorus-Therian' },
        },
        {
          teamName: 'Alpine Arcanines',
          pokemon: { id: 'tornadustherian', name: 'Tornadus-Therian' },
        },
        {
          teamName: 'Twinleaf Tatsugiri',
          pokemon: { id: 'tapulele', name: 'Tapu Lele' },
        },
        {
          teamName: 'Kalos Quagsires',
          pokemon: { id: 'urshifu', name: 'Urshifu-Single' },
        },
        {
          teamName: 'Tampa T-Chainz',
          pokemon: { id: 'chiyu', name: 'Chi-Yu' },
        },
        {
          teamName: `Fitchburg's Sun Chasers`,
          pokemon: { id: 'roaringmoon', name: 'Roaring Moon	' },
        },
        {
          teamName: 'Deep Sea Duskulls',
          pokemon: { id: 'gholdengo', name: 'Gholdengo' },
        },
        {
          teamName: `I like 'em THICC`,
          status: 'Skipped',
        },
        {
          teamName: `Midnight teddy's`,
          pokemon: { id: 'zeraora', name: 'Zeraora' },
        },
        {
          teamName: `Chicago Sky Attack`,
          pokemon: { id: 'zygarde', name: 'Zygarde' },
        },
        {
          teamName: `Deimos Deoxys`,
          pokemon: { id: 'archaludon', name: 'Archaludon' },
        },
      ],
      [
        {
          teamName: 'Mighty Murkrow',
        },
        {
          teamName: 'Montreal Mean Mareanies',
        },
        {
          teamName: 'Philadelphia Flygons',
        },
        {
          teamName: 'London Vespiquens',
        },
        {
          teamName: 'Chicago White Fox',
        },
        {
          teamName: 'Victorious Vigoroths',
        },
        {
          teamName: 'Alpine Arcanines',
        },
        {
          teamName: 'Twinleaf Tatsugiri',
        },
        {
          teamName: 'Kalos Quagsires',
        },
        {
          teamName: 'Tampa T-Chainz',
        },
        {
          teamName: `Fitchburg's Sun Chasers`,
        },
        {
          teamName: 'Deep Sea Duskulls',
          status: 'On Deck',
        },
        {
          teamName: `I like 'em THICC`,
          status: 'Picking',
        },
        {
          teamName: `Midnight teddy's`,
          pokemon: { id: 'infernape', name: 'Infernape' },
        },
        {
          teamName: `Chicago Sky Attack`,
          pokemon: { id: 'scizormega', name: 'Scizor-Mega' },
        },
        {
          teamName: `Deimos Deoxys`,
          pokemon: { id: 'pelipper', name: 'Pelipper' },
        },
      ].reverse(),
    ]);
  }
}
