import { DecimalPipe } from '@angular/common';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import {
  AdminService,
  AgeSegment,
  BucketCount,
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
import { TimeSeriesChartComponent } from '../charts/time-series-chart.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';

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

type RangePreset = '30d' | '90d' | '6m' | '1y' | 'all' | 'custom';

interface RangeOption {
  value: Exclude<RangePreset, 'custom'>;
  label: string;
}

const RANGE_PRESETS: RangeOption[] = [
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
];

const BUCKET_LABELS: Record<BucketUnit, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function presetStart(preset: RangePreset, today: Date): string {
  const start = new Date(today);
  if (preset === '30d') start.setUTCDate(start.getUTCDate() - 30);
  else if (preset === '90d') start.setUTCDate(start.getUTCDate() - 90);
  else if (preset === '6m') start.setUTCMonth(start.getUTCMonth() - 6);
  else if (preset === '1y') start.setUTCFullYear(start.getUTCFullYear() - 1);
  return isoDay(start);
}

function bucketEnd(start: Date, bucket: BucketUnit): number {
  const end = new Date(start);
  if (bucket === 'day') end.setUTCDate(end.getUTCDate() + 1);
  else if (bucket === 'week') end.setUTCDate(end.getUTCDate() + 7);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end.getTime();
}

function inRange(
  from: string,
  to: string,
  bucket: BucketUnit,
): (point: BucketCount) => boolean {
  const fromMs = from ? new Date(from).getTime() : -Infinity;
  const toMs = to ? new Date(to).getTime() + DAY_MS : Infinity;
  return (point) => {
    const start = new Date(point.date);
    return start.getTime() < toMs && bucketEnd(start, bucket) > fromMs;
  };
}

function total(points: BucketCount[]): number {
  return points.reduce((sum, p) => sum + p.count, 0);
}

@Component({
  selector: 'pdz-admin-dashboard',
  imports: [
    DecimalPipe,
    EmptyStateComponent,
    SkeletonLayoutComponent,
    TimeSeriesChartComponent,
    PieChartComponent,
    BarChartComponent,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    FieldComponent,
    InputDirective,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly buckets: BucketUnit[] = ['day', 'week', 'month'];
  readonly bucketLabels = BUCKET_LABELS;
  readonly bucket = signal<BucketUnit>('week');

  readonly rangePresets = RANGE_PRESETS;
  readonly rangePreset = signal<RangePreset>('1y');
  private readonly customFrom = signal('');
  private readonly customTo = signal('');
  readonly today = localDay(new Date());

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

  readonly dataStart = computed(() => {
    const s = this.series();
    if (!s) return '';
    const firsts = [s.joined[0]?.date, s.lastLogin[0]?.date]
      .filter((date): date is string => !!date)
      .sort();
    return firsts.length ? firsts[0].slice(0, 10) : '';
  });

  readonly rangeFrom = computed(() => {
    const preset = this.rangePreset();
    if (preset === 'custom') return this.customFrom();
    if (preset === 'all') return this.dataStart();
    return presetStart(preset, new Date(this.today));
  });

  readonly rangeTo = computed(() =>
    this.rangePreset() === 'custom' ? this.customTo() : this.today,
  );

  readonly visibleSeries = computed<UserTimeSeries | null>(() => {
    const s = this.series();
    if (!s) return null;
    const keep = inRange(this.rangeFrom(), this.rangeTo(), s.bucket);
    return {
      bucket: s.bucket,
      joined: s.joined.filter(keep),
      cumulative: s.cumulative.filter(keep),
      lastLogin: s.lastLogin.filter(keep),
    };
  });

  readonly joinedInRange = computed(() =>
    total(this.visibleSeries()?.joined ?? []),
  );

  readonly lastLoginInRange = computed(() =>
    total(this.visibleSeries()?.lastLogin ?? []),
  );

  ngOnInit(): void {
    this.loadSummary();
    this.loadSeries();
    this.loadProviders();
    this.loadEngagement();
    this.loadAccountAge();
    this.loadSettings();
  }

  setBucket(bucket: BucketUnit | undefined): void {
    if (bucket === undefined || bucket === this.bucket()) return;
    this.bucket.set(bucket);
    this.loadSeries();
  }

  setPreset(preset: RangePreset | undefined): void {
    if (preset === undefined) return;
    this.rangePreset.set(preset);
  }

  setFrom(value: string): void {
    this.customTo.set(this.rangeTo());
    this.customFrom.set(value);
    this.rangePreset.set('custom');
  }

  setTo(value: string): void {
    this.customFrom.set(this.rangeFrom());
    this.customTo.set(value);
    this.rangePreset.set('custom');
  }

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
      { label: 'Total Users', value: s.totalUsers, hint: 'All time' },
      { label: 'New Users', value: s.newUsersLast7Days, hint: 'Last 7 days' },
      { label: 'New Users', value: s.newUsersLast30Days, hint: 'Last 30 days' },
      {
        label: 'Active Users',
        value: s.activeUsersLast7Days,
        hint: 'Logged in · 7 days',
      },
      {
        label: 'Active Users',
        value: s.activeUsersLast30Days,
        hint: 'Logged in · 30 days',
      },
      {
        label: 'Active Users',
        value: s.activeUsersLast90Days,
        hint: 'Logged in · 90 days',
      },
    ];
  }

  protected loadSummary(): void {
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

  protected loadSeries(): void {
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
