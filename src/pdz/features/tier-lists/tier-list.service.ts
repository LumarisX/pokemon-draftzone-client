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

export type DraftedDivisions = {
  divisions: { [division: string]: { pokemonId: string; teamId: string }[] };
  selected?: string;
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
        // On a cold load the component is constructed before NavigationEnd
        // fires, so without this the id is still null when it asks for its
        // tier list and the request falls through to the league context.
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
        const tierListId = paramMap.get('tierListId');
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
    return this.apiService.post<{ id: string; name: string }>(
      ROOTPATH,
      payload,
    );
  }

  fork(tierListId: string, payload: { name?: string } = {}) {
    return this.apiService.post<{
      id: string;
      name: string;
      copiedFrom: string;
    }>(`${ROOTPATH}/${tierListId}/fork`, payload);
  }

  /**
   * The routed `:tierListId` when there is one, else the tier list attached to
   * the tournament in context. Errors rather than requesting with null slugs
   * when neither is available.
   */
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
      divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
      ruleset?: string;
      name?: string;
      description?: string;
      draftCount?: { min: number; max: number };
    }>(`${ROOTPATH}/${tierListId}`),
      ),
    );
  }

  getDraftedByDivision(): Observable<DraftedDivisions> {
    if (!this.leagueZoneService.tournamentSlug()) return of({ divisions: {} });

    return this.leagueZoneService.getTeamsByDraft().pipe(
      map((data) => {
        const divisions: DraftedDivisions['divisions'] = {};
        const routedDraftSlug = this.leagueZoneService.draftSlug();
        let routed: string | undefined;
        let coached: string | undefined;

        // A draft-scoped route is bound to one pool, so it gets that pool's
        // takings alone — there is nothing for the viewer to switch between.
        const groups = routedDraftSlug
          ? data.drafts.filter((group) => group.draftSlug === routedDraftSlug)
          : data.drafts;

        for (const group of groups) {
          if (group.draftSlug === routedDraftSlug) routed = group.name;

          const held = (divisions[group.name] ??= []);
          for (const team of group.teams) {
            if (team.isCoach) coached = group.name;
            for (const pokemon of team.draft) {
              held.push({ pokemonId: pokemon.id, teamId: team.id });
            }
          }
        }

        return {
          divisions,
          selected: routed ?? coached ?? Object.keys(divisions)[0],
        };
      }),
      catchError(() => of({ divisions: {} })),
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
        this.apiService.patch<{ success: boolean }>(
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
          divisions: { [key: string]: { pokemonId: string; teamId: string }[] };
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
        this.apiService.patch<{ success: boolean; message: string }>(
          `${ROOTPATH}/${tierListId}`,
          { tiers },
        ),
      ),
    );
  }
}
