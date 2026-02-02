import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeagueZoneService } from '../../../services/leagues/league-zone.service';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pdz-league-manage-signups',
  templateUrl: './league-manage-signups.component.html',
  styleUrls: ['./league-manage-signups.component.scss'],
  imports: [CommonModule],
})
export class LeagueManageSignupsComponent implements OnInit {
  tournamentId: string | null = null;
  signUps: League.LeagueSignUp[] = [];

  route = inject(ActivatedRoute);
  leagueService = inject(LeagueZoneService);

  ngOnInit(): void {
    this.getSignUps();
  }

  getSignUps(): void {
    this.leagueService.getSignUps().subscribe({
      next: (signUps) => {
        this.signUps = signUps;
      },
      error: (error) => {
        console.error('Error fetching sign-ups:', error);
      },
    });
  }

  getLogoUrl = getLogoUrl('league-uploads');
}
