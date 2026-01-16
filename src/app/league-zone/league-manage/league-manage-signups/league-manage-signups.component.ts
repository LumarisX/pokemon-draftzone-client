import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';

@Component({
  selector: 'pdz-league-manage-signups',
  templateUrl: './league-manage-signups.component.html',
  styleUrls: ['./league-manage-signups.component.scss'],
})
export class LeagueManageSignupsComponent implements OnInit {
  leagueId: string | null = null;
  signUps: League.LeagueSignUp[] = [];

  route = inject(ActivatedRoute);
  leagueService = inject(LeagueZoneService);

  ngOnInit(): void {
    this.leagueId = this.route.snapshot.paramMap.get('leagueId');
    if (this.leagueId) {
      this.getSignUps(this.leagueId);
    }
  }

  getSignUps(leagueId: string): void {
    this.leagueService.getSignUps(leagueId).subscribe({
      next: (signUps) => {
        this.signUps = signUps;
      },
      error: (error) => {
        console.error('Error fetching sign-ups:', error);
      },
    });
  }
}
