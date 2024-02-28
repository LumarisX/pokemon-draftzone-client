import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchupComponent } from './matchup/matchup.component';

@Component({
  selector: 'matchup-overview',
  standalone: true,
  templateUrl: 'matchup-overview.component.html',
  imports: [CommonModule, MatchupComponent, RouterModule],
})
export class MatchupOverviewComponent implements OnInit {
  matchupId = '';
  shared = false;
  copyText = 'Copy';
  shareUrl = '';
  leagueId = '';

  @ViewChild('inputFieldRef') inputFieldRef!: ElementRef;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('id' in params) {
        this.matchupId = params['id'];
        this.shareUrl = 'localhost:4200/matchup/' + this.matchupId;
      }
      let leagueId = this.route.snapshot.paramMap.get('teamid');
      if (leagueId) {
        this.leagueId = leagueId;
      }
    });
  }

  share() {
    this.shared = true;
    this.copyText = 'Copy';
  }

  copyToClipboard() {
    this.copyText = 'Copied!';
    navigator.clipboard
      .writeText(this.shareUrl)
      .then(() => {
        console.log('URL copied to clipboard: ' + this.shareUrl);
      })
      .catch((error) => {
        console.error('Failed to copy URL to clipboard: ', error);
      });
  }
}
