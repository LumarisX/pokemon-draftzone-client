import { Component, inject, OnInit } from '@angular/core';

import { TradeLog } from '../league.interface';
import { TradeCardComponent } from './trade-card/trade-card.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';

@Component({
  selector: 'pdz-league-trades',
  imports: [TradeCardComponent],
  templateUrl: './league-trades.component.html',
  styleUrls: ['./league-trades.component.scss'],
})
export class LeagueTradesComponent implements OnInit {
  tradeLogs: TradeLog[] = [];

  leagueService = inject(LeagueZoneService);

  ngOnInit() {
    this.leagueService.getTrades().subscribe((trades) => {
      console.log('Received trades:', trades);
      this.tradeLogs = trades;
    });
  }
}
