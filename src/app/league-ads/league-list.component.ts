import { Component, OnInit } from '@angular/core';
import { LeagueAd, LeagueAdsService } from '../api/league-ads.service';
import { CommonModule } from '@angular/common';
import { BALLHEX, BallSVG } from '../images/svg-components/ball.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-league-ad-list',
  templateUrl: './league-list.component.html',
  standalone: true,
  imports: [CommonModule, BallSVG, FormsModule],
})
export class LeagueAdListComponent implements OnInit {
  leagues: LeagueAd[] = [];
  filteredLeagues: LeagueAd[] = [];
  formats = ['Singles', 'VGC'];
  selectedFormat = '';
  sortOption: 'createdAt' | 'seasonStart' | 'closesAt' = 'createdAt';

  SKILLBALLS: (keyof typeof BALLHEX)[] = ['poke', 'great', 'ultra', 'master'];

  constructor(private leagueService: LeagueAdsService) {}

  ngOnInit() {
    this.leagueService.getLeagueAds().subscribe((data) => {
      this.leagues = data;
      this.filteredLeagues = [...this.leagues];
    });
  }

  filterLeagues() {
    this.filteredLeagues = this.leagues.filter((league) =>
      this.selectedFormat
        ? league.divisions.some((d) => d.format === this.selectedFormat)
        : true
    );
    this.sortLeagues();
  }

  sortLeagues() {
    this.filteredLeagues = this.filteredLeagues.sort((a, b) =>
      a[this.sortOption] > b[this.sortOption] ? 1 : -1
    );
  }

  getWeeks(league: LeagueAd) {
    return Math.round(
      Math.abs(
        new Date(league.seasonEnd).getTime() -
          new Date(league.seasonStart).getTime()
      ) / 604800000
    );
  }

  getMinSkill(league: LeagueAd): number {
    return league.divisions.reduce(
      (prev, division) =>
        division.skillLevelRange.to < prev
          ? division.skillLevelRange.from
          : prev,
      3
    );
  }
}
