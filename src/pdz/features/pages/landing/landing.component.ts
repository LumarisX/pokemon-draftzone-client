import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { DRAFT_OVERVIEW_PATH, LEAGUE_ADS_PATH } from '@pdz/core/route-paths';
import {
  LeagueAd,
  LeagueAdsService,
} from '@pdz/features/league-list/league-ads.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { BadgeComponent } from '@pdz/shared/data/badge/badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

const PREVIEW_COUNT = 6;

@Component({
  selector: 'pdz-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    BadgeComponent,
    CardComponent,
    SkeletonComponent,
    SelectComponent,
    SelectOptionComponent,
    EmptyStateComponent,
    IconComponent,
    FieldComponent,
    InputDirective,
  ],
})
export class LandingComponent {
  private readonly leagueAdsService = inject(LeagueAdsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly leagueListPath = '/' + LEAGUE_ADS_PATH;
  protected readonly newAdPath = '/' + LEAGUE_ADS_PATH + '/manage/new';
  protected readonly draftsPath = '/' + DRAFT_OVERVIEW_PATH;
  protected readonly previewSlots = Array.from({ length: PREVIEW_COUNT });

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly query = signal('');
  protected readonly format = signal<string>('');

  private readonly leagues = signal<LeagueAd[]>([]);

  protected readonly openLeagues = computed(() =>
    this.leagues().filter((league) => league.recruitmentStatus === 'Open'),
  );

  protected readonly formats = computed(() => {
    const seen = new Set<string>();
    for (const league of this.openLeagues()) {
      for (const format of league.formats ?? []) {
        if (format) seen.add(format);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  });

  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    const format = this.format();
    return this.openLeagues().filter((league) => {
      if (format && !(league.formats ?? []).includes(format)) return false;
      if (!query) return true;
      return (
        league.leagueName.toLowerCase().includes(query) ||
        league.organizer.toLowerCase().includes(query)
      );
    });
  });

  protected readonly preview = computed(() =>
    this.matches().slice(0, PREVIEW_COUNT),
  );

  protected readonly filtering = computed(
    () => !!this.query().trim() || !!this.format(),
  );

  constructor() {
    forkJoin([
      this.leagueAdsService.getLeagueAds().pipe(catchError(() => of(null))),
      this.leagueAdsService
        .getHostedLeagueAds()
        .pipe(catchError(() => of(null))),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([external, hosted]) => {
        if (external === null && hosted === null) {
          this.failed.set(true);
        } else {
          this.leagues.set([...(hosted ?? []), ...(external ?? [])]);
        }
        this.loading.set(false);
      });
  }

  protected clearFilters(): void {
    this.query.set('');
    this.format.set('');
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
  }

  protected chipsFor(league: LeagueAd): string[] {
    return [...(league.formats ?? []).slice(0, 2), ...(league.rulesets ?? []).slice(0, 1)];
  }
}
