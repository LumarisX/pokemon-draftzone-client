import { inject, Injectable } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import {
  TierListChange,
  TierListLegality,
} from '@pdz/features/tier-lists/tier-list.model';
import { LeagueZoneService } from '../league-zone.service';
import { AffectedPick } from '../tournament-log/tournament-log.service';

export type RequirementPlan = {
  tierName: string;
  required: number;
  max?: number;
  kept: boolean;
};

export type SwapPreview = {
  incoming: {
    slug: string;
    name: string;
    authorName: string | null;
    format: string;
    ruleset: string;
    tierCount: number;
  };
  current: { slug: string; name: string } | null;
  changes: TierListChange[];
  legality: TierListLegality;
  requirements: RequirementPlan[];
  draftStarted: boolean;
  affectedPicks: AffectedPick[];
};

export type MergeConflict = {
  pokemonId: string;
  name: string;
  source: { name: string; tierId?: string; banned?: boolean } | null;
  current: { name: string; tierId?: string; banned?: boolean } | null;
};

export type SourceStatus = {
  source: {
    slug: string;
    name: string;
    authorName: string | null;
    version: number;
  } | null;
  copiedFromVersion?: number | null;
  hasBase?: boolean;
  behind?: boolean;
  changes?: TierListChange[];
  conflicts?: MergeConflict[];
};

@Injectable({ providedIn: 'root' })
export class TournamentTierListService {
  private readonly api = inject(ApiService);
  private readonly league = inject(LeagueZoneService);

  private path(...rest: string[]): string {
    return [
      'leagues',
      this.league.leagueSlug(),
      'tournaments',
      this.league.tournamentSlug(),
      'tier-list',
      ...rest,
    ].join('/');
  }

  preview(from: string) {
    return this.api.get<SwapPreview>(this.path('preview'), { params: { from } });
  }

  attach(body: {
    tierListSlug?: string;
    blank?: { name: string; format: string; ruleset: string };
    reason?: string;
  }) {
    return this.api.post<{
      slug: string;
      name: string;
      message: string;
      requirements: RequirementPlan[];
    }>(this.path('attach'), body);
  }

  source() {
    return this.api.get<SourceStatus>(this.path('source'));
  }

  pull(body: {
    version: number;
    resolutions?: Record<string, 'source' | 'current'>;
    reason?: string;
  }) {
    return this.api.post<{ message: string; version: number; summary: string }>(
      this.path('pull'),
      body,
    );
  }

  saveAsPreset(name: string) {
    return this.api.post<{ slug: string; name: string }>(this.path('save-as-preset'), {
      name,
    });
  }
}
