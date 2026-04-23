import { Component, OnInit, inject } from '@angular/core';
import {
  FlexBracketData,
  LeagueBracketFlexComponent,
} from './league-bracket-flex/league-bracket-flex.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';

@Component({
  selector: 'pdz-league-bracket',
  imports: [LeagueBracketFlexComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);

  bracketData?: FlexBracketData;
  tournamentKey?: string;

  ngOnInit(): void {
    this.tournamentKey = this.leagueService.tournamentKey() ?? undefined;
    this.leagueService.getBracket().subscribe((data) => {
      this.bracketData = data;
    });
  }
}
