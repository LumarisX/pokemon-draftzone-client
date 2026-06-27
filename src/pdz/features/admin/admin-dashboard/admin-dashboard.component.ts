import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  AdminService,
  AgeSegment,
  BucketUnit,
  EngagementSegment,
  KeyedCount,
  LoginProvider,
  ProviderCount,
  SettingsDistributions,
  UserStatsSummary,
  UserTimeSeries,
} from '../admin.service';
import { BarChartComponent, BarDatum } from '../charts/bar-chart.component';
import { PieChartComponent, PieDatum } from '../charts/pie-chart.component';
import {
  SeriesPoint,
  TimeSeriesChartComponent,
} from '../charts/time-series-chart.component';

interface SummaryCard {
  label: string;
  value: number;
  hint: string;
}

const PROVIDER_LABELS: Record<LoginProvider, string> = {
  google: 'Google',
  discord: 'Discord',
  auth0: 'Email / Password',
  other: 'Other',
};

const ENGAGEMENT_LABELS: Record<EngagementSegment, string> = {
  '7d': '≤ 7 days',
  '30d': '8–30 days',
  '90d': '31–90 days',
  dormant: '90+ days',
};

const AGE_LABELS: Record<AgeSegment, string> = {
  lt1m: '< 1 month',
  '1to3m': '1–3 months',
  '3to6m': '3–6 months',
  '6to12m': '6–12 months',
  gt1y: '1 year+',
};

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

@Component({
  selector: 'pdz-admin-dashboard',
  imports: [
    DecimalPipe,
    LoadingComponent,
    TimeSeriesChartComponent,
    PieChartComponent,
    BarChartComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly buckets: BucketUnit[] = ['day', 'week', 'month'];
  readonly bucket = signal<BucketUnit>('week');

  readonly summary = signal<UserStatsSummary | null>(null);
  readonly summaryLoading = signal(true);
  readonly summaryError = signal(false);

  readonly series = signal<UserTimeSeries | null>(null);
  readonly seriesLoading = signal(true);
  readonly seriesError = signal(false);

  readonly providers = signal<ProviderCount[] | null>(null);
  readonly providersLoading = signal(true);
  readonly providersError = signal(false);

  readonly engagement = signal<KeyedCount<EngagementSegment>[] | null>(null);
  readonly accountAge = signal<KeyedCount<AgeSegment>[] | null>(null);
  readonly settings = signal<SettingsDistributions | null>(null);

  ngOnInit(): void {
    this.loadSummary();
    this.loadSeries();
    this.loadProviders();
    this.loadEngagement();
    this.loadAccountAge();
    this.loadSettings();
  }

  setBucket(bucket: BucketUnit): void {
    if (bucket === this.bucket()) return;
    this.bucket.set(bucket);
    this.loadSeries();
  }

  // --- Derived chart data -------------------------------------------------

  get providerData(): PieDatum[] {
    return (this.providers() ?? []).map((p) => ({
      label: PROVIDER_LABELS[p.provider],
      value: p.count,
    }));
  }

  get engagementData(): PieDatum[] {
    return (this.engagement() ?? []).map((e) => ({
      label: ENGAGEMENT_LABELS[e.key],
      value: e.count,
    }));
  }

  get accountAgeData(): BarDatum[] {
    return (this.accountAge() ?? []).map((a) => ({
      label: AGE_LABELS[a.key],
      value: a.count,
    }));
  }

  get themeData(): BarDatum[] {
    return (this.settings()?.theme ?? []).map((t) => ({
      label: titleCase(t.value),
      value: t.count,
    }));
  }

  get spriteData(): BarDatum[] {
    return (this.settings()?.spriteSet ?? []).map((s) => ({
      label: titleCase(s.value),
      value: s.count,
    }));
  }

  get shinyData(): PieDatum[] {
    return (this.settings()?.shinyUnlock ?? []).map((s) => ({
      label: s.value,
      value: s.count,
    }));
  }

  get summaryCards(): SummaryCard[] {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Total users', value: s.totalUsers, hint: 'All time' },
      { label: 'New users', value: s.newUsersLast7Days, hint: 'Last 7 days' },
      { label: 'New users', value: s.newUsersLast30Days, hint: 'Last 30 days' },
      {
        label: 'Active users',
        value: s.activeUsersLast7Days,
        hint: 'Logged in · 7 days',
      },
      {
        label: 'Active users',
        value: s.activeUsersLast30Days,
        hint: 'Logged in · 30 days',
      },
      {
        label: 'Active users',
        value: s.activeUsersLast90Days,
        hint: 'Logged in · 90 days',
      },
    ];
  }

  // --- Loaders ------------------------------------------------------------

  private loadSummary(): void {
    this.summaryLoading.set(true);
    this.summaryError.set(false);
    this.adminService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.summaryLoading.set(false);
      },
      error: () => {
        this.summaryError.set(true);
        this.summaryLoading.set(false);
      },
    });
  }

  private loadSeries(): void {
    this.seriesLoading.set(true);
    this.seriesError.set(false);
    this.adminService.getUserTimeSeries(this.bucket()).subscribe({
      next: (series) => {
        this.series.set(series);
        this.seriesLoading.set(false);
      },
      error: () => {
        this.seriesError.set(true);
        this.seriesLoading.set(false);
      },
    });
  }

  private loadProviders(): void {
    this.providersLoading.set(true);
    this.providersError.set(false);
    this.adminService.getLoginProviders().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.providersLoading.set(false);
      },
      error: () => this.providersError.set(true),
    });
  }

  private loadEngagement(): void {
    this.adminService.getEngagement().subscribe({
      next: (engagement) => this.engagement.set(engagement),
    });
  }

  private loadAccountAge(): void {
    this.adminService.getAccountAge().subscribe({
      next: (age) => this.accountAge.set(age),
    });
  }

  private loadSettings(): void {
    this.adminService.getSettingsDistributions().subscribe({
      next: (settings) => this.settings.set(settings),
    });
  }
}
