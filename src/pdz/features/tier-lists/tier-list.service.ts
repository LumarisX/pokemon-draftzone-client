import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  catchError,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';
import { LeagueTier } from './tier-list.model';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone/league-zone.service';

const ROOTPATH = 'tier-lists';

export type TierListSummary = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  format: string;
  ruleset: string;
  tierCount: number;
  pokemonCount: number;
  isPublic: boolean;
  forkCount: number;
  copiedFrom?: string;
  isOwner: boolean;
  canEdit: boolean;
  updatedAt?: string;
};

export type TierListBrowseResult = {
  tierLists: TierListSummary[];
  total: number;
  limit: number;
  skip: number;
};

export type TierListBrowseQuery = {
  scope?: 'mine' | 'public';
  q?: string;
  format?: string;
  ruleset?: string;
  limit?: number;
  skip?: number;
};

export type DraftedPools = {
  pools: { [pool: string]: { pokemonId: string; teamId: string }[] };
  selected?: string;
  sharedPools?: string[];
  coachedTeamIds?: string[];
};

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
        startWith(null),
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
        const tierListId =
          paramMap.get('tierListSlug') ?? paramMap.get('tierListId');
        this.tierListId.set(tierListId);
      });
  }

  browse(query: TierListBrowseQuery) {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = String(value);
      }
    }
    return this.apiService.get<TierListBrowseResult>(ROOTPATH, { params });
  }

  create(payload: {
    name: string;
    description?: string;
    format: string;
    ruleset: string;
  }) {
    return this.apiService.post<{ id: string; slug: string; name: string }>(
      ROOTPATH,
      payload,
    );
  }

  fork(tierListSlug: string, payload: { name?: string } = {}) {
    return this.apiService.post<{
      id: string;
      slug: string;
      name: string;
      copiedFrom: string;
    }>(`${ROOTPATH}/${tierListSlug}/fork`, payload);
  }

  remove(tierListSlug: string) {
    return this.apiService.delete<{ message: string }>(
      `${ROOTPATH}/${tierListSlug}`,
    );
  }

  private resolveTierListId(): Observable<string> {
    const routed = this.tierListId();
    if (routed) return of(routed);

    if (!this.leagueZoneService.tournamentSlug()) {
      return throwError(() => new Error('No tier list selected'));
    }

    return this.leagueZoneService.getLeagueInfo().pipe(
      switchMap((info) =>
        info.tierListId
          ? of(info.tierListId)
          : throwError(
              () => new Error('No tier list connected to this tournament'),
            ),
      ),
    );
  }

  getTierList() {
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.get<{
      tierList: LeagueTier[];
      format?: string;
      ruleset?: string;
      name?: string;
      description?: string;
      draftCount?: { min: number; max: number };
    }>(`${ROOTPATH}/${tierListId}`),
      ),
    );
  }

  getDraftedByPool(): Observable<DraftedPools> {
    if (!this.leagueZoneService.tournamentSlug()) return of({ pools: {} });

    return this.leagueZoneService.getTeamsByPool().pipe(
      map((data) => {
        const pools: DraftedPools['pools'] = {};
        const routedPoolSlug = this.leagueZoneService.poolSlug();
        let routed: string | undefined;
        let coached: string | undefined;
        const sharedPools: string[] = [];
        const coachedTeamIds: string[] = [];

        const groups = routedPoolSlug
          ? data.pools.filter((group) => group.poolSlug === routedPoolSlug)
          : data.pools;

        for (const group of groups) {
          if (group.poolSlug === routedPoolSlug) routed = group.name;
          if (group.allowDuplicates) sharedPools.push(group.name);

          const held = (pools[group.name] ??= []);
          for (const team of group.teams) {
            if (team.isCoach) {
              coached = group.name;
              coachedTeamIds.push(team.id);
            }
            if (group.allowDuplicates && !team.isCoach) continue;
            for (const pokemon of team.draft) {
              held.push({ pokemonId: pokemon.id, teamId: team.id });
            }
          }
        }

        return {
          pools,
          selected: routed ?? coached ?? Object.keys(pools)[0],
          sharedPools,
          coachedTeamIds,
        };
      }),
      catchError(() => of({ pools: {} })),
    );
  }

  getSettings() {
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.get<{
          name: string;
          description?: string;
        }>(`${ROOTPATH}/${tierListId}/settings`),
      ),
    );
  }

  updateSettings(settings: { name?: string; description?: string }) {
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.patch<{ message: string }>(
          `${ROOTPATH}/${tierListId}/settings`,
          settings,
        ),
      ),
    );
  }

  getTierListEdit() {
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.get<{
          tierList: LeagueTier[];
          name?: string;
          ruleset?: string;
        }>(`${ROOTPATH}/${tierListId}`, { params: { edit: true } }),
      ),
    );
  }

  saveTierListEdit(
    tiers: Array<{
      id?: string;
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
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.patch<{ message: string }>(
          `${ROOTPATH}/${tierListId}`,
          { tiers },
        ),
      ),
    );
  }
}
