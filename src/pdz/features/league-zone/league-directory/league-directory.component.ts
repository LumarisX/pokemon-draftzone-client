import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LEAGUE_ADS_PATH, LEAGUE_ZONE_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLeagueLogoUrl } from '../league.util';

type StatusFilter = 'all' | 'signups' | 'drafting' | 'season';

const STATUS: Record<
  League.DirectoryStatus,
  { label: string; tone: ChipTone }
> = {
  signups: { label: 'Signing Up', tone: 'success' },
  drafting: { label: 'Drafting', tone: 'info' },
  season: { label: 'In Season', tone: 'neutral' },
  upcoming: { label: 'Upcoming', tone: 'neutral' },
  between: { label: 'Between Seasons', tone: 'neutral' },
};

@Component({
  selector: 'pdz-league-directory',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChipComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonLayoutComponent,
    TeamComponent,
  ],
  templateUrl: './league-directory.component.html',
  styleUrl: './league-directory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueDirectoryComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly offSiteLink = ['/', LEAGUE_ADS_PATH];
  protected readonly newLeagueLink = ['/', LEAGUE_ZONE_PATH, 'new'];
  protected readonly status = STATUS;

  protected readonly all = signal<League.DirectoryLeague[] | null>(null);
  protected readonly failed = signal(false);
  protected readonly query = signal('');
  protected readonly filter = signal<StatusFilter>('all');

  protected readonly leagues = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const filter = this.filter();
    return (this.all() ?? [])
      .filter(
        (league) =>
          filter === 'all' ||
          league.tournaments.some((tournament) => tournament.status === filter),
      )
      .filter(
        (league) =>
          !needle ||
          [
            league.name,
            ...league.tournaments.flatMap((tournament) => [
              tournament.name,
              tournament.format ?? '',
              tournament.ruleset ?? '',
            ]),
          ]
            .join(' ')
            .toLowerCase()
            .includes(needle),
      )
      .map((league) => {
        const link = ['/', LEAGUE_ZONE_PATH, league.leagueSlug];
        return {
          ...league,
          link,
          logoSrc: getLeagueLogoUrl(league.logo ?? undefined),
          tournaments: league.tournaments.map((tournament) => {
            const tournamentLink = [
              ...link,
              'tournaments',
              tournament.tournamentSlug,
            ];
            return {
              ...tournament,
              link: tournamentLink,
              signUpLink: [...tournamentLink, 'sign-up'],
              meta: [tournament.format, tournament.ruleset]
                .filter((part) => !!part)
                .join(' · '),
            };
          }),
        };
      });
  });

  protected readonly filtered = computed(
    () => !!this.query().trim() || this.filter() !== 'all',
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.all.set(null);
    this.leagueService
      .getDirectory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (directory) => this.all.set(directory.leagues),
        error: () => this.failed.set(true),
      });
  }

  protected setFilter(value: StatusFilter | undefined): void {
    this.filter.set(value ?? 'all');
  }
}
