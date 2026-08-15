import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { TradeLog } from '../../league.interface';
import { TradeCardComponent } from './trade-card/trade-card.component';

@Component({
  selector: 'pdz-league-trade-widget',
  imports: [TradeCardComponent],
  templateUrl: './league-trade-widget.component.html',
  styleUrl: './league-trade-widget.component.scss',
})
export class LeagueTradeWidgetComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  @Input() stageSlug!: string;

  tradeRounds?: { name: string; trades: TradeLog[] }[];
  currentRoundIndex = -1;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.leagueService
      .getTrades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.currentRoundIndex = data.currentRoundIndex ?? -1;
          this.tradeRounds = [...data.rounds]
            .filter((round) => round.trades.length)
            .reverse();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
