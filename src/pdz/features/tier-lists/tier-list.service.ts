import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap, switchMap, throwError } from 'rxjs';
import { LeagueTier } from './tier-list.model';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone/league-zone.service';

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
        }>(`${ROOTPATH}/${info.tierListId}/settings`, { authenticated: true });
      }),
    );
  }

  updateSettings(settings: { name?: string; description?: string }) {
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
        ruleset?: string;
      }>(`${ROOTPATH}/${tierListId}`, {
        authenticated: true,
        params: { edit: true },
      });
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
          ruleset?: string;
        }>(`${ROOTPATH}/${info.tierListId}`, {
          authenticated: true,
          params: { edit: true },
        });
      }),
    );
  }

  saveTierListEdit(
    tiers: Array<{
      name: string;
      cost: number;
      pokemon: Array<{
        id: string;
        name: string;
        banned?: boolean;
        notes?: string;
        bannedAbilities?: string[];
        formes?: string[];
      }>;
    }>,
  ) {
    const tierListId = this.tierListId();
    if (tierListId) {
      return this.apiService.patch<{ success: boolean; message: string }>(
        `${ROOTPATH}/${tierListId}`,
        { tiers },
      );
    }
    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) {
          return throwError(
            () => new Error('No tier list connected to this tournament'),
          );
        }
        return this.apiService.patch<{ success: boolean; message: string }>(
          `${ROOTPATH}/${info.tierListId}`,
          { tiers },
        );
      }),
    );
  }
}
