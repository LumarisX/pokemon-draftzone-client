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
      // TODO: remove — forces first match to have a winner for visual testing
      const patched = { ...data, matches: [...data.matches] };
      if (patched.matches.length > 0) {
        patched.matches[0] = { ...patched.matches[0], winner: 0 };
      }
      this.bracketData = patched;
    });
  }
}
