import { Component, OnInit, inject } from '@angular/core';
import {
  BracketDataNormalized,
  LeagueBracketGraphComponent,
} from './league-single-elim-bracket/league-bracket-graph.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';

@Component({
  selector: 'pdz-league-bracket',
  imports: [LeagueBracketGraphComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);

  bracketData?: BracketDataNormalized;

  ngOnInit(): void {
    this.leagueService.getBracket().subscribe((data) => {
      this.bracketData = data;
    });
  }
}
