import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { Observable, tap } from 'rxjs';

export const DISCORD_ERROR = {
  notConfigured: 'USR-021',
  alreadyConnected: 'USR-022',
  stateInvalid: 'USR-023',
  exchangeFailed: 'USR-024',
  signInCannotDisconnect: 'USR-025',
  required: 'USR-026',
  mergeOfferInvalid: 'USR-028',
  mergeUnavailable: 'USR-029',
  mergeBlocked: 'USR-030',
} as const;

export type DiscordHolder = 'discord' | 'google' | 'email' | 'other';

export interface AccountSummary {
  profileId: string;
  displayName: string;
  joined: string | null;
  signInMethod: DiscordHolder;
  counts: {
    teams: number;
    leagues: number;
    tournaments: number;
    drafts: number;
    tierLists: number;
    plans: number;
  };
}

export interface MergeOffer {
  token: string;
  expiresAt: string;
  current: AccountSummary;
  other: AccountSummary;
  blockers: string[];
}

export type MergeKeep = 'current' | 'other';

export interface DiscordCallbackResult {
  me: Me;
  returnTo: string;
}

@Injectable({ providedIn: 'root' })
export class DiscordConnectionService {
  private readonly api = inject(ApiService);
  private readonly roleService = inject(RoleService);

  begin(returnTo: string): Observable<{ url: string }> {
    return this.api.post<{ url: string }>('users/discord/connect', {
      returnTo,
    });
  }

  complete(code: string, state: string): Observable<DiscordCallbackResult> {
    return this.api
      .post<DiscordCallbackResult>('users/discord/callback', { code, state })
      .pipe(tap((result) => this.roleService.setMe(result.me)));
  }

  merge(token: string, keep: MergeKeep): Observable<{ me: Me }> {
    return this.api.post<{ me: Me }>('users/merge', { token, keep });
  }

  disconnect(): Observable<Me> {
    return this.api
      .delete<Me>('users/discord')
      .pipe(tap((me) => this.roleService.setMe(me)));
  }

  go(url: string): void {
    window.location.href = url;
  }
}
