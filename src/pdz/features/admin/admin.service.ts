import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@pdz/core/services/api.service';

export type BucketUnit = 'day' | 'week' | 'month';

export interface UserStatsSummary {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  activeUsersLast7Days: number;
  activeUsersLast30Days: number;
  activeUsersLast90Days: number;
  generatedAt: string;
}

export interface BucketCount {
  date: string;
  count: number;
}

export interface UserTimeSeries {
  bucket: BucketUnit;
  joined: BucketCount[];
  cumulative: BucketCount[];
  lastLogin: BucketCount[];
}

export type LoginProvider = 'google' | 'discord' | 'auth0' | 'other';

export interface ProviderCount {
  provider: LoginProvider;
  count: number;
}

export type EngagementSegment = '7d' | '30d' | '90d' | 'dormant';
export type AgeSegment = 'lt1m' | '1to3m' | '3to6m' | '6to12m' | 'gt1y';

export interface KeyedCount<K extends string> {
  key: K;
  count: number;
}

export interface ValueCount {
  value: string;
  count: number;
}

export interface SettingsDistributions {
  theme: ValueCount[];
  spriteSet: ValueCount[];
  shinyUnlock: ValueCount[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiService = inject(ApiService);

  getSummary(): Observable<UserStatsSummary> {
    return this.apiService.get<UserStatsSummary>('admin/users/summary', {
      authenticated: true,
    });
  }

  getUserTimeSeries(bucket: BucketUnit): Observable<UserTimeSeries> {
    return this.apiService.get<UserTimeSeries>('admin/users/time-series', {
      authenticated: true,
      params: { bucket },
    });
  }

  getLoginProviders(): Observable<ProviderCount[]> {
    return this.apiService.get<ProviderCount[]>('admin/users/login-providers', {
      authenticated: true,
    });
  }

  getEngagement(): Observable<KeyedCount<EngagementSegment>[]> {
    return this.apiService.get<KeyedCount<EngagementSegment>[]>(
      'admin/users/engagement',
      { authenticated: true },
    );
  }

  getAccountAge(): Observable<KeyedCount<AgeSegment>[]> {
    return this.apiService.get<KeyedCount<AgeSegment>[]>(
      'admin/users/account-age',
      { authenticated: true },
    );
  }

  getSettingsDistributions(): Observable<SettingsDistributions> {
    return this.apiService.get<SettingsDistributions>(
      'admin/users/settings-distribution',
      { authenticated: true },
    );
  }
}
