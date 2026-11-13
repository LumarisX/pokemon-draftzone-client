import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { toApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { safeStorage } from '@pdz/core/utils/storage';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  take,
  timeout,
} from 'rxjs';

export type SyncedPlan = {
  draftName?: string;
  team?: unknown[];
  [field: string]: unknown;
};

export type SavedPlanner = {
  key: string;
  updatedAt: string | null;
  tournament: {
    leagueSlug: string;
    tournamentSlug: string;
    name: string | null;
    leagueName: string | null;
  } | null;
  plans: { name: string; format: string; ruleset: string; size: number }[];
};

type ServerPlans = { plans: SyncedPlan[] | null; revision: number };
type SyncMeta = { sub: string; revision: number; json: string };

export const FREE_PLANNER_KEY = 'plannerData';
export const MAX_SYNCED_PLANS = 9;

const RECONCILE_TIMEOUT_MS = 4000;
const PLANS_PATH = 'planner/plans';
const QUIET = { suppressErrorReporting: true };

function metaKey(key: string): string {
  return `${key}:sync`;
}

function parsePlans(json: string | null): SyncedPlan[] | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as SyncedPlan[]) : null;
  } catch {
    return null;
  }
}

function hasPokemon(plan: SyncedPlan): boolean {
  return Array.isArray(plan.team) && plan.team.length > 0;
}

function planName(plan: SyncedPlan): string {
  return (plan.draftName ?? '').trim().toLowerCase();
}

export function mergePlans(
  server: SyncedPlan[],
  local: SyncedPlan[],
): SyncedPlan[] {
  const merged = [...server];
  const names = new Set(server.map(planName));
  const known = new Set(server.map((plan) => JSON.stringify(plan)));
  for (const plan of local) {
    if (merged.length >= MAX_SYNCED_PLANS) break;
    if (!hasPokemon(plan) || known.has(JSON.stringify(plan))) continue;
    merged.push(
      names.has(planName(plan))
        ? { ...plan, draftName: `${plan.draftName || 'Plan'} (This Device)` }
        : plan,
    );
  }
  return merged;
}

export function plannerKeyFor(route: ActivatedRouteSnapshot): string {
  if (route.data['planner'] !== 'tournament') return FREE_PLANNER_KEY;
  const params = route.pathFromRoot.reduce<Record<string, string>>(
    (all, part) => ({ ...all, ...part.params }),
    {},
  );
  return `${FREE_PLANNER_KEY}:${params['leagueSlug']}/${params['tournamentSlug']}`;
}

export const plannerSyncResolver: ResolveFn<boolean> = (route) =>
  inject(PlannerSyncService).reconcile(plannerKeyFor(route));

@Injectable({ providedIn: 'root' })
export class PlannerSyncService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly merged = new Subject<string>();

  private sub: string | null = null;
  private warned = false;
  private readonly sending = new Set<string>();
  private readonly queued = new Map<string, string>();

  reconcile(key: string): Observable<boolean> {
    return combineLatest([this.auth.isAuthenticated$, this.auth.user$]).pipe(
      take(1),
      switchMap(([authenticated, user]) => {
        this.sub = authenticated ? (user?.sub ?? null) : null;
        if (!this.sub) return of(true);
        return this.fetch(key).pipe(
          map((server) => {
            this.apply(key, server);
            return true;
          }),
        );
      }),
      timeout(RECONCILE_TIMEOUT_MS),
      catchError(() => of(true)),
    );
  }

  push(key: string, json: string): void {
    if (!this.sub) return;
    if (this.sending.has(key)) {
      this.queued.set(key, json);
      return;
    }
    this.send(key, json, this.meta(key)?.revision ?? 0, true);
  }

  list(): Observable<SavedPlanner[]> {
    return this.api
      .get<{ planners: SavedPlanner[] }>(PLANS_PATH)
      .pipe(map((result) => result.planners));
  }

  private fetch(key: string): Observable<ServerPlans> {
    return this.api.get<ServerPlans>(PLANS_PATH, {
      params: { key },
      errorHandlingOptions: QUIET,
    });
  }

  private meta(key: string): SyncMeta | null {
    const meta = safeStorage.getJson<SyncMeta>(metaKey(key));
    return meta && meta.sub === this.sub ? meta : null;
  }

  private remember(key: string, revision: number, json: string): void {
    if (this.sub)
      safeStorage.setJson(metaKey(key), { sub: this.sub, revision, json });
  }

  private apply(key: string, server: ServerPlans): void {
    const localJson = safeStorage.get(key);
    const local = parsePlans(localJson);
    const meta = this.meta(key);
    const localHasPlans = !!local?.some(hasPokemon);

    if (!server.plans) {
      if (localJson && localHasPlans) this.send(key, localJson, 0, true);
      return;
    }

    if (meta?.revision === server.revision) {
      if (localJson && localJson !== meta.json)
        this.send(key, localJson, server.revision, true);
      return;
    }

    const serverJson = JSON.stringify(server.plans);
    const localChanged = localHasPlans && localJson !== meta?.json;
    const merged = localChanged
      ? mergePlans(server.plans, local ?? [])
      : server.plans;
    const mergedJson = JSON.stringify(merged);
    safeStorage.set(key, mergedJson);
    this.remember(key, server.revision, serverJson);
    if (mergedJson !== serverJson)
      this.send(key, mergedJson, server.revision, true);
  }

  private send(
    key: string,
    json: string,
    revision: number,
    retryOnConflict: boolean,
  ): void {
    const plans = parsePlans(json);
    if (!plans) return;
    this.sending.add(key);
    this.api
      .put<{ revision: number }>(PLANS_PATH, { key, revision, plans })
      .subscribe({
        next: (saved) => {
          this.remember(key, saved.revision, json);
          this.finish(key);
        },
        error: (error) => {
          if (toApiError(error)?.status === 409 && retryOnConflict) {
            this.resolveConflict(key);
            return;
          }
          this.finish(key);
          this.warn();
        },
      });
  }

  private resolveConflict(key: string): void {
    this.fetch(key).subscribe({
      next: (server) => {
        const queued = this.queued.get(key);
        this.queued.delete(key);
        const local = parsePlans(queued ?? safeStorage.get(key)) ?? [];
        const merged = mergePlans(server.plans ?? [], local);
        const mergedJson = JSON.stringify(merged);
        safeStorage.set(key, mergedJson);
        this.remember(key, server.revision, JSON.stringify(server.plans ?? []));
        this.send(key, mergedJson, server.revision, false);
        this.merged.next(key);
      },
      error: () => {
        this.finish(key);
        this.warn();
      },
    });
  }

  private finish(key: string): void {
    this.sending.delete(key);
    const queued = this.queued.get(key);
    if (queued === undefined) return;
    this.queued.delete(key);
    this.push(key, queued);
  }

  private warn(): void {
    if (this.warned) return;
    this.warned = true;
    this.toast.error(
      'Could not save your plans to your account. They are still saved in this browser.',
    );
  }
}
