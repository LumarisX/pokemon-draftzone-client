import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pdz-league-team',
  imports: [CommonModule],
  templateUrl: './league-team.component.html',
  styleUrls: ['./league-team.component.scss'],
})
export class LeagueTeamComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private activatedRoute = inject(ActivatedRoute);

  teamData: any = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const teamId = params.get('teamId');
        if (teamId) {
          this.fetchTeamData(teamId);
        }
      });
  }

  fetchTeamData(teamId: string): void {
    this.loading = true;
    this.error = null;

    this.leagueService
      .getTeam(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.teamData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.message || 'Failed to fetch team data';
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
