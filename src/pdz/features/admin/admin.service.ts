import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@pdz/core/services/api.service';
import {
  ChatReport,
  ChatReportResolution,
} from '@pdz/features/league-zone/league-chat/league-chat.model';

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
    return this.apiService.get<UserStatsSummary>('admin/users/summary');
  }

  getUserTimeSeries(bucket: BucketUnit): Observable<UserTimeSeries> {
    return this.apiService.get<UserTimeSeries>('admin/users/time-series', {
      params: { bucket },
    });
  }

  getLoginProviders(): Observable<ProviderCount[]> {
    return this.apiService.get<ProviderCount[]>('admin/users/login-providers');
  }

  getEngagement(): Observable<KeyedCount<EngagementSegment>[]> {
    return this.apiService.get<KeyedCount<EngagementSegment>[]>(
      'admin/users/engagement',
    );
  }

  getAccountAge(): Observable<KeyedCount<AgeSegment>[]> {
    return this.apiService.get<KeyedCount<AgeSegment>[]>(
      'admin/users/account-age',
    );
  }

  getChatReports(): Observable<{ reports: ChatReport[] }> {
    return this.apiService.get<{ reports: ChatReport[] }>('admin/chat-reports');
  }

  resolveChatReport(
    reportId: string,
    action: ChatReportResolution,
  ): Observable<{ resolved: true; action: ChatReportResolution }> {
    return this.apiService.post(`admin/chat-reports/${reportId}/resolve`, {
      action,
    });
  }

  resetDisplayName(
    profileId: string,
    note: string,
  ): Observable<{ reset: true }> {
    return this.apiService.post('admin/users/reset-display-name', {
      profileId,
      note,
    });
  }

  getSettingsDistributions(): Observable<SettingsDistributions> {
    return this.apiService.get<SettingsDistributions>(
      'admin/users/settings-distribution',
    );
  }
}
