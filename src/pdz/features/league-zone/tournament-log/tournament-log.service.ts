import { inject, Injectable } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { TierListChange } from '@pdz/features/tier-lists/tier-list.model';
import { LeagueZoneService } from '../league-zone.service';

export const LOG_REASON_MAX = 300;

export type TournamentLogType =
  | 'tier-list.attached'
  | 'tier-list.swapped'
  | 'tier-list.edited'
  | 'tier-list.pulled'
  | 'tier-list.reverted'
  | 'settings.unlocked'
  | 'settings.changed';

export type SettingChange = {
  field: string;
  label: string;
  before: unknown;
  after: unknown;
};

export type AffectedPick = {
  team: string;
  pokemonId: string;
  name: string;
  from: number | null;
  to: number | null;
};

export type TournamentLogEntry = {
  seq: number;
  at: string;
  actorName: string | null;
  type: TournamentLogType;
  summary: string;
  target?: { kind: string; id?: string; name?: string };
  before?: unknown;
  after?: unknown;
  details?: {
    changes?: TierListChange[] | SettingChange[];
    affectedPicks?: AffectedPick[];
    requirementsCleared?: string[];
    requirementsKept?: string[];
    version?: number;
    source?: { slug: string; name: string };
  };
  reason?: string;
};

export type TournamentLogPage = {
  entries: TournamentLogEntry[];
  next: number | null;
  visibility: 'participants' | 'public';
};

@Injectable({ providedIn: 'root' })
export class TournamentLogService {
  private readonly api = inject(ApiService);
  private readonly league = inject(LeagueZoneService);

  list(options: { types?: TournamentLogType[]; before?: number } = {}) {
    const params: Record<string, string | number> = {};
    if (options.types?.length) params['types'] = options.types.join(',');
    if (options.before !== undefined) params['before'] = options.before;
    return this.api.get<TournamentLogPage>(
      `leagues/${this.league.leagueSlug()}/tournaments/${this.league.tournamentSlug()}/log`,
      { params, errorHandlingOptions: { suppressStatuses: [403] } },
    );
  }
}
