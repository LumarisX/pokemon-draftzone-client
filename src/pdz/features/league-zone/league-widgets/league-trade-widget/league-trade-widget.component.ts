import { Component, inject, OnDestroy, OnInit, input } from '@angular/core';
import { finalize, Subject, take, takeUntil } from 'rxjs';
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

  readonly stageSlug = input<string>();

  readonly withdrawableTeamId = input<string>();

  tradeRounds?: { name: string; trades: TradeLog[] }[];
  currentRoundIndex = -1;
  withdrawingTradeId: string | null = null;
  withdrawError = '';

  canWithdraw(trade: TradeLog): boolean {
    const teamId = this.withdrawableTeamId();
    if (!teamId || !trade.id || trade.status !== 'PENDING') return false;
    return [trade.side1, trade.side2].some((side) => side.team?.id === teamId);
  }

  withdraw(trade: TradeLog): void {
    if (!trade.id || this.withdrawingTradeId) return;

    this.withdrawingTradeId = trade.id;
    this.withdrawError = '';

    this.leagueService
      .withdrawTrade(trade.id)
      .pipe(
        take(1),
        finalize(() => {
          this.withdrawingTradeId = null;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => this.reload(),
        error: (err) => {
          this.withdrawError = err?.message || 'Could not withdraw the trade.';
        },
      });
  }

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
