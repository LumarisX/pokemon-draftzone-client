import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, switchMap, throwError } from 'rxjs';
import { LeagueTier } from '../interfaces/tier-pokemon.interface';
import { ApiService } from './api.service';
import { LeagueZoneService } from './leagues/league-zone.service';

const ROOTPATH = 'tier-lists';

@Injectable({
  providedIn: 'root',
})
export class TierListService {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private leagueZoneService = inject(LeagueZoneService);

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
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.get<{
        tierList: LeagueTier[];
        divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
        ruleset?: string;
        name?: string;
        description?: string;
        draftCount?: { min: number; max: number };
      }>(`${ROOTPATH}/${tierListId}`);
    }
    // Tournament context: resolve tierListId from the tournament's info
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.get<{
          tierList: LeagueTier[];
          divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
          ruleset?: string;
          name?: string;
          description?: string;
          draftCount?: { min: number; max: number };
        }>(`${ROOTPATH}/${info.tierListId}`);
      }),
    );
  }

  getSettings() {
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.get<{
        name: string;
        description?: string;
        pointTotal?: number;
        draftCount: { min: number; max: number };
      }>(`${ROOTPATH}/${tierListId}/settings`, { authenticated: true });
    }
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.get<{
          name: string;
          description?: string;
          pointTotal?: number;
          draftCount: { min: number; max: number };
        }>(`${ROOTPATH}/${info.tierListId}/settings`, { authenticated: true });
      }),
    );
  }

  updateSettings(settings: {
    name?: string;
    description?: string;
    pointTotal?: number;
    draftCount?: { min: number; max: number };
  }) {
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.patch<{ success: boolean }>(
        `${ROOTPATH}/${tierListId}/settings`,
        settings,
      );
    }
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.patch<{ success: boolean }>(
          `${ROOTPATH}/${info.tierListId}/settings`,
          settings,
        );
      }),
    );
  }

  getTierListEdit() {
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.get<{
        tierList: LeagueTier[];
        divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
        name?: string;
      }>(`${ROOTPATH}/${tierListId}/edit`, { authenticated: true });
    }
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.get<{
          tierList: LeagueTier[];
          divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
          name?: string;
        }>(`${ROOTPATH}/${info.tierListId}/edit`, { authenticated: true });
      }),
    );
  }

  saveTierListEdit(
    tiers: Array<{
      name: string;
      cost: number;
      pokemon: Array<{ id: string; name: string; banned?: boolean }>;
    }>,
  ) {
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.post<{ success: boolean; message: string }>(
        `${ROOTPATH}/${tierListId}/edit`,
        { tiers },
        { authenticated: true },
      );
    }
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.post<{ success: boolean; message: string }>(
          `${ROOTPATH}/${info.tierListId}/edit`,
          { tiers },
          { authenticated: true },
        );
      }),
    );
  }
}
