import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';
import { LeagueTier } from '../interfaces/tier-pokemon.interface';
import { ApiService } from './api.service';

const ROOTPATH = 'tier-lists';

@Injectable({
  providedIn: 'root',
})
export class TierListService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  tierListId = signal<string | null>(null);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.router.routerState.root;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.paramMap),
      )
      .subscribe((paramMap) => {
        const tierListId = paramMap.get('tierListId');
        this.tierListId.set(tierListId);
      });
  }

  getTierList() {
    return this.apiService.get<{
      tierList: LeagueTier[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
      ruleset?: string;
    }>(`${ROOTPATH}/${this.tierListId()}`);
  }

  getTierListEdit() {
    return this.apiService.get<{
      tierList: LeagueTier[];
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
    }>(`${ROOTPATH}/${this.tierListId()}/edit`, { authenticated: true });
  }

  saveTierListEdit(
    tiers: Array<{
      name: string;
      cost: number;
      pokemon: Array<{ id: string; name: string; banned?: boolean }>;
    }>,
  ) {
    return this.apiService.post<{ success: boolean; message: string }>(
      `${ROOTPATH}/${this.tierListId()}/edit`,
      { tiers },
      { authenticated: true },
    );
  }
}
