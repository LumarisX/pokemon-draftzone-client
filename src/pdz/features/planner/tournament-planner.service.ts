import { Injectable, inject } from '@angular/core';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { tierListBase } from '@pdz/features/tier-lists/tier-list-links';
import { LeagueTier } from '@pdz/features/tier-lists/tier-list.model';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { PokemonSearchOption } from '@pdz/shared/dropdowns/pokemon-search/pokemon-search.component';
import {
  BehaviorSubject,
  Observable,
  catchError,
  debounceTime,
  forkJoin,
  map,
  merge,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { toApiError } from '@pdz/core/services/api-error';
import {
  PlannerContext,
  PlannerOwner,
  PlannerTier,
  PlannerTierRequirement,
} from './planner-context';

type PoolGroup = {
  poolSlug: string | null;
  name: string;
  allowDuplicates: boolean;
  teams: League.LeagueTeam[];
};

type PoolRules = {
  points: number | null;
  min: number | null;
  tierRequirements: PlannerTierRequirement[];
};

const DEFAULT_DRAFT_COUNT = { min: 10, max: 12 };
const ROSTER_EVENTS = ['league.draft.added', 'league.draft.updated'];
const ROSTER_EVENT_DEBOUNCE_MS = 500;
const BAN_TIERS = new Set(['Ban', 'Banned']);
const NO_POOL_RULES: PoolRules = {
  points: null,
  min: null,
  tierRequirements: [],
};

@Injectable({ providedIn: 'root' })
export class TournamentPlannerService {
  private readonly league = inject(LeagueZoneService);
  private readonly tierLists = inject(TierListService);
  private readonly eventStream = inject(EventStreamService);

  load(): Observable<PlannerContext | null> {
    return this.league.getLeagueInfo().pipe(
      switchMap((info) => {
        if (!info.tierListId) return of(null);
        return forkJoin({
          view: this.tierLists.getTierListBySlug(info.tierListId).pipe(
            catchError((error) =>
              toApiError(error)?.status === 404
                ? of(null)
                : throwError(() => error),
            ),
          ),
          pools: this.league.getTeamsByPool().pipe(
            map((data) => data.pools),
            catchError(() => of([] as PoolGroup[])),
          ),
        }).pipe(
          switchMap(({ view, pools }) => {
            if (!view) return of(null);
            const group = this.viewerPool(pools);
            return this.poolRules(group).pipe(
              map((rules) =>
                this.build(info, view.tierList, view.draftCount, group, rules),
              ),
            );
          }),
        );
      }),
    );
  }

  rosterChanged(): Observable<void> {
    return merge(
      ...ROSTER_EVENTS.map((event) => this.eventStream.on<unknown>(event)),
    ).pipe(
      debounceTime(ROSTER_EVENT_DEBOUNCE_MS),
      map(() => undefined),
    );
  }

  private viewerPool(pools: PoolGroup[]): PoolGroup | null {
    return (
      pools.find((group) => group.teams.some((team) => team.isCoach)) ??
      (pools.length === 1 ? pools[0] : null)
    );
  }

  private poolRules(group: PoolGroup | null): Observable<PoolRules> {
    if (!group?.poolSlug) return of(NO_POOL_RULES);
    return this.league.getPoolDetails(group.poolSlug).pipe(
      map((details) => ({
        points: details.points ?? null,
        min: details.minDraftCount ?? null,
        tierRequirements: (details.tierRequirements ?? []).map(
          (requirement) => ({
            tierName: requirement.tierName,
            required: requirement.required,
          }),
        ),
      })),
      catchError(() => of(NO_POOL_RULES)),
    );
  }

  private build(
    info: League.LeagueInfo,
    tierList: LeagueTier[],
    listDraftCount: { min: number; max: number } | undefined,
    group: PoolGroup | null,
    rules: PoolRules,
  ): PlannerContext {
    const tiers = new Map<string, PlannerTier>();
    const options: PokemonSearchOption[] = [];

    for (const tier of tierList) {
      if (BAN_TIERS.has(tier.name)) continue;
      for (const pokemon of tier.pokemon) {
        if (pokemon.draftBanned || tiers.has(pokemon.id)) continue;
        tiers.set(pokemon.id, { tier: tier.name, cost: tier.cost ?? null });
        options.push({
          id: pokemon.id,
          name: pokemon.name,
          tier: tier.name,
          ...(tier.cost != null ? { cost: tier.cost } : {}),
        });
      }
    }

    const myTeam = group?.teams.find((team) => team.isCoach) ?? null;
    const owners = new Map<string, PlannerOwner>();
    const drafted = [
      ...(myTeam?.draft ?? []),
      ...(group?.teams ?? []).flatMap((team) => team.draft),
    ];

    for (const pokemon of drafted) {
      if (tiers.has(pokemon.id)) continue;
      tiers.set(pokemon.id, {
        tier: pokemon.tier ?? '',
        cost: pokemon.cost ?? null,
      });
      options.push({
        id: pokemon.id,
        name: pokemon.name,
        tier: pokemon.tier,
        cost: pokemon.cost,
      });
    }

    if (group && !group.allowDuplicates) {
      for (const team of group.teams) {
        if (team.isCoach) continue;
        for (const pokemon of team.draft) {
          owners.set(pokemon.id, {
            teamName: team.name,
            teamLogo: getTeamLogoSrc(team.logo),
          });
        }
      }
    }

    const draftCount =
      info.draftCount ?? listDraftCount ?? DEFAULT_DRAFT_COUNT;
    const roster = (myTeam?.draft ?? []).map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
    }));

    return {
      storageKey: `plannerData:${this.league.leagueSlug()}/${this.league.tournamentSlug()}`,
      name: info.name,
      teamName: myTeam?.name ?? null,
      format: info.format,
      ruleset: info.ruleset,
      min: rules.min || draftCount.min,
      max: Math.max(draftCount.max, roster.length),
      totalPoints: rules.points ?? info.pointTotal ?? 0,
      tiers,
      owners,
      options$: new BehaviorSubject<DraftPokemon[]>(options),
      roster,
      tierRequirements: rules.tierRequirements,
      tierListLink: tierListBase(this.league, info.tierListId),
    };
  }
}
