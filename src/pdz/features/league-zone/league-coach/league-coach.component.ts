import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLogoUrl } from '../league.util';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

@Component({
  selector: 'pdz-league-coach',
  imports: [CommonModule, RouterModule, LoadingComponent, IconComponent,
    ButtonComponent,
  ],
  templateUrl: './league-coach.component.html',
  styleUrl: './league-coach.component.scss',
})
export class LeagueCoachComponent implements OnInit, OnDestroy {
  readonly leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  profile: League.CoachProfile | null = null;
  leagueInfo: League.LeagueInfo | null = null;
  isLoading = true;
  error = false;
  getLogoUrl = getLogoUrl;

  get draftBase(): string[] {
    const { leagueSlug, tournamentSlug } = this;
    const draftSlug = this.profile?.draft?.draftSlug;
    if (!leagueSlug || !tournamentSlug || !draftSlug) return [];
    return [
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
      'drafts',
      draftSlug,
    ];
  }

  get teamLink(): string[] {
    return [...this.tournamentBase(), 'teams', this.profile?.teamSlug ?? ''];
  }

  get scheduleLink(): string[] {
    return [...this.tournamentBase(), 'schedule'];
  }

  get standingsLink(): string[] {
    return [...this.tournamentBase(), 'standings'];
  }

  private get leagueSlug() {
    return this.leagueService.leagueSlug();
  }
  private get tournamentSlug() {
    return this.leagueService.tournamentSlug();
  }

  tournamentBase(): string[] {
    const { leagueSlug, tournamentSlug } = this;
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/leagues', leagueSlug, 'tournaments', tournamentSlug];
  }

  ngOnInit(): void {
    this.leagueService
      .getCoachData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoading = false;
        },
        error: () => {
          this.error = true;
          this.isLoading = false;
        },
      });

    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => (this.leagueInfo = info),
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
