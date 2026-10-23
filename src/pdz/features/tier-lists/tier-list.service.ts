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
import {
  ImportPreview,
  LayoutId,
  LeagueTier,
  TierListAccess,
  TierListChange,
  TierListLegality,
  TierListMembers,
  TierListMeta,
  TierListRevision,
  TierListRole,
  TierListSettings,
  TierListVisibility,
} from './tier-list.model';
import { ApiService } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '../league-zone/league-zone.service';

const ROOTPATH = 'tier-lists';

export type TierListSummary = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  authorName?: string;
  format: string;
  ruleset: string;
  tags: string[];
  tierCount: number;
  pokemonCount: number;
  visibility: TierListVisibility;
  featured: boolean;
  forkCount: number;
  useCount: number;
  copiedFrom?: { slug: string; name: string } | null;
  access: TierListAccess;
  role: 'owner' | TierListRole | null;
  topPokemon: { id: string; name: string }[];
  updatedAt?: string;
};

export type TierListBrowseResult = {
  tierLists: TierListSummary[];
  total: number;
  limit: number;
  skip: number;
};

export type TierListScope = 'mine' | 'shared' | 'public' | 'featured';
export type TierListSort = 'updated' | 'forks' | 'uses' | 'name';

export type TierListBrowseQuery = {
  scope?: TierListScope;
  q?: string;
  format?: string;
  ruleset?: string;
  tag?: string;
  pokemon?: string;
  sort?: TierListSort;
  limit?: number;
  skip?: number;
};

export type DraftedPick = {
  pokemonId: string;
  teamId?: string;
  teamName?: string;
  teamLogo?: string;
};

export type DraftedPools = {
  pools: { [pool: string]: DraftedPick[] };
  selected?: string;
  sharedPools?: string[];
  coachedTeamIds?: string[];
};

export type ClientTier = {
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
};

export type TierListView = {
  tierList: LeagueTier[];
  format?: string;
  ruleset?: string;
  name?: string;
  description?: string;
  draftCount?: { min: number; max: number };
  meta?: TierListMeta;
};

export type SaveResult = {
  message: string;
  version: number;
  summary?: string;
  orphanedRequirements?: { tournament: string; requirements: number }[];
};

export type TierListExport = {
  kind: 'pokemon-draftzone/tier-list';
  version: number;
  name: string;
  description?: string;
  format: string;
  ruleset: string;
  tiers: {
    name: string;
    cost: number;
    pokemon: { id: string; name: string; notes?: string }[];
  }[];
  banned: {
    pokemon: { id: string; name: string }[];
    moves: string[];
    abilities: string[];
  };
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
    authorName?: string;
    format: string;
    ruleset: string;
    tags?: string[];
    tiers?: ClientTier[];
    bannedMoves?: string[];
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

  resolveTierListId(): Observable<string> {
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
        this.apiService.get<TierListView>(`${ROOTPATH}/${tierListId}`),
      ),
    );
  }

  getTierListBySlug(slug: string) {
    return this.apiService.get<TierListView>(`${ROOTPATH}/${slug}`);
  }

  getTierListEditBySlug(slug: string) {
    return this.apiService.get<TierListView>(`${ROOTPATH}/${slug}`, {
      params: { edit: true },
    });
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
              held.push({
                pokemonId: pokemon.id,
                teamId: team.id,
                teamName: team.name,
                teamLogo: team.logo,
              });
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
        this.apiService.get<TierListSettings>(
          `${ROOTPATH}/${tierListId}/settings`,
        ),
      ),
    );
  }

  updateSettings(settings: Partial<TierListSettings>, slug?: string) {
    const id$ = slug ? of(slug) : this.resolveTierListId();
    return id$.pipe(
      switchMap((tierListId) =>
        this.apiService.patch<{ message: string; settings: TierListSettings }>(
          `${ROOTPATH}/${tierListId}/settings`,
          settings,
        ),
      ),
    );
  }

  getTierListEdit() {
    return this.resolveTierListId().pipe(
      switchMap((tierListId) =>
        this.apiService.get<TierListView>(`${ROOTPATH}/${tierListId}`, {
          params: { edit: true },
        }),
      ),
    );
  }

  saveTierListEdit(
    tiers: ClientTier[],
    options: { version?: number; kind?: 'edit' | 'import'; reason?: string } = {},
    slug?: string,
  ) {
    const id$ = slug ? of(slug) : this.resolveTierListId();
    return id$.pipe(
      switchMap((tierListId) =>
        this.apiService.patch<SaveResult>(`${ROOTPATH}/${tierListId}`, {
          tiers,
          ...options,
        }),
      ),
    );
  }

  revisions(slug: string, before?: number) {
    return this.apiService.get<{
      current: number;
      revisions: TierListRevision[];
      next: number | null;
    }>(`${ROOTPATH}/${slug}/revisions`, {
      params: before !== undefined ? { before } : {},
    });
  }

  revision(slug: string, version: number) {
    return this.apiService.get<TierListRevision & { changes: TierListChange[] }>(
      `${ROOTPATH}/${slug}/revisions/${version}`,
    );
  }

  revert(slug: string, version: number, currentVersion: number) {
    return this.apiService.post<SaveResult>(
      `${ROOTPATH}/${slug}/revisions/${version}/revert`,
      { version: currentVersion },
    );
  }

  compare(slug: string, against: { with?: string; rev?: number } = {}) {
    const params: Record<string, string | number> = {};
    if (against.with) params['with'] = against.with;
    if (against.rev !== undefined) params['rev'] = against.rev;
    return this.apiService.get<{
      base: { label: string; slug: string; version: number };
      target: { label: string; slug: string; version: number };
      changes: TierListChange[];
    }>(`${ROOTPATH}/${slug}/compare`, { params });
  }

  legality(slug: string) {
    return this.apiService.get<TierListLegality>(`${ROOTPATH}/${slug}/legality`);
  }

  exportJson(slug: string) {
    return this.apiService.get<TierListExport>(`${ROOTPATH}/${slug}/export`);
  }

  members(slug: string) {
    return this.apiService.get<TierListMembers>(`${ROOTPATH}/${slug}/members`);
  }

  createInvite(slug: string, role: TierListRole, maxUses?: number) {
    return this.apiService.post<{
      id: string;
      token: string;
      role: TierListRole;
      expiresAt: string;
      maxUses: number;
    }>(`${ROOTPATH}/${slug}/invites`, { role, ...(maxUses && { maxUses }) });
  }

  revokeInvite(slug: string, inviteId: string) {
    return this.apiService.delete<{ message: string }>(
      `${ROOTPATH}/${slug}/invites/${inviteId}`,
    );
  }

  previewInvite(token: string) {
    return this.apiService.get<{
      tierList: {
        slug: string;
        name: string;
        authorName: string | null;
        format: string;
        ruleset: string;
      };
      role: TierListRole;
      expiresAt: string;
      alreadyMember: boolean;
    }>(`${ROOTPATH}/invites/${token}`, {
      errorHandlingOptions: { suppressStatuses: [404] },
    });
  }

  acceptInvite(token: string, name: string) {
    return this.apiService.post<{ slug: string }>(
      `${ROOTPATH}/invites/${token}/accept`,
      { name },
    );
  }

  setRole(slug: string, memberId: string, role: TierListRole) {
    return this.apiService.patch<{ message: string }>(
      `${ROOTPATH}/${slug}/members/${memberId}`,
      { role },
    );
  }

  removeMember(slug: string, memberId: string) {
    return this.apiService.delete<{ message: string }>(
      `${ROOTPATH}/${slug}/members/${memberId}`,
    );
  }

  transfer(slug: string, memberId: string) {
    return this.apiService.post<{ message: string }>(
      `${ROOTPATH}/${slug}/members/${memberId}/transfer`,
      {},
    );
  }

  setFeatured(slug: string, featured: boolean) {
    return this.apiService.patch<{ featured: boolean }>(
      `${ROOTPATH}/${slug}/featured`,
      { featured },
    );
  }

  previewImport(payload: {
    text?: string;
    url?: string;
    format: string;
    ruleset: string;
    layout?: LayoutId;
  }) {
    return this.apiService.post<ImportPreview>(
      `${ROOTPATH}/import/preview`,
      payload,
    );
  }

  rememberNames(entries: { text: string; pokemonIds: string[] }[]) {
    return this.apiService.post<{ saved: number }>(
      `${ROOTPATH}/import/aliases`,
      { entries },
    );
  }

  forgetNames() {
    return this.apiService.delete<{ cleared: number }>(
      `${ROOTPATH}/import/aliases`,
    );
  }
}
