import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { getLeagueLogoUrl } from '../league.util';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import {
  TournamentLink,
  TournamentLinkGroup,
  manageDraftLinks,
  manageLinkGroups,
} from '../tournaments/tournament-links';

@Component({
  selector: 'pdz-league-manage-hub',
  imports: [
    CommonModule,
    RouterModule,
    IconComponent,
    LoadingComponent,
    ChipComponent,
    PageHeaderComponent,
  ],
  templateUrl: './league-manage-hub.component.html',
  styleUrls: ['./league-manage-hub.component.scss'],
})
export class LeagueManageHubComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);

  leagueInfo: League.LeagueInfo | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();

  getLogoUrl = getLeagueLogoUrl;

  get leagueSlug() {
    return this.leagueService.leagueSlug();
  }

  get tournamentSlug() {
    return this.leagueService.tournamentSlug();
  }

  get tournamentBase(): string[] {
    const { leagueSlug, tournamentSlug } = this;
    if (!leagueSlug || !tournamentSlug) return [];
    return ['/leagues', leagueSlug, 'tournaments', tournamentSlug];
  }

  get linkGroups(): TournamentLinkGroup[] {
    return manageLinkGroups(this.tournamentBase).map((group) => ({
      ...group,
      links: group.links.filter((link) => link.id !== 'manage-hub'),
    }));
  }

  draftLinks(draft: { name: string; draftSlug: string }): TournamentLink[] {
    return manageDraftLinks(this.tournamentBase, draft);
  }

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.leagueInfo = info;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading tournament info:', err);
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isSignUpOpen(): boolean {
    if (!this.leagueInfo?.signUpDeadline) return false;
    return new Date() <= new Date(this.leagueInfo.signUpDeadline);
  }

  isDraftActive(): boolean {
    if (!this.leagueInfo?.draftStart || !this.leagueInfo?.draftEnd)
      return false;
    const now = new Date();
    return (
      now >= new Date(this.leagueInfo.draftStart) &&
      now <= new Date(this.leagueInfo.draftEnd)
    );
  }

  isSeasonActive(): boolean {
    if (!this.leagueInfo?.seasonStart || !this.leagueInfo?.seasonEnd)
      return false;
    const now = new Date();
    return (
      now >= new Date(this.leagueInfo.seasonStart) &&
      now <= new Date(this.leagueInfo.seasonEnd)
    );
  }
}
