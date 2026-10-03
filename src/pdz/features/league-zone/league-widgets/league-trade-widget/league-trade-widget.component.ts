import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { TradeLog } from '@pdz/features/league-zone/league.interface';
import { TradeCardComponent } from '@pdz/features/league-zone/trade-card/trade-card.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { finalize } from 'rxjs';

export type TradeSummary = {
  total: number;
  pending: number;
  currentRoundName?: string;
};

@Component({
  selector: 'pdz-league-trade-widget',
  imports: [ButtonComponent, EmptyStateComponent, TradeCardComponent],
  templateUrl: './league-trade-widget.component.html',
  styleUrl: './league-trade-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTradeWidgetComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stageSlug = input<string>();
  readonly withdrawableTeamId = input<string>();
  readonly summaryChange = output<TradeSummary>();

  readonly tradeRounds = signal<{ name: string; trades: TradeLog[] }[] | null>(
    null,
  );
  readonly currentRoundIndex = signal(-1);
  readonly withdrawingTradeId = signal<string | null>(null);
  readonly withdrawError = signal('');

  ngOnInit(): void {
    this.reload();
  }

  canWithdraw(trade: TradeLog): boolean {
    const teamId = this.withdrawableTeamId();
    if (!teamId || !trade.id || trade.status !== 'PENDING') return false;
    return [trade.side1, trade.side2].some((side) => side.team?.id === teamId);
  }

  withdraw(trade: TradeLog): void {
    if (!trade.id || this.withdrawingTradeId()) return;

    this.withdrawingTradeId.set(trade.id);
    this.withdrawError.set('');

    this.leagueService
      .withdrawTrade(trade.id)
      .pipe(
        finalize(() => this.withdrawingTradeId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.reload(),
        error: (err) =>
          this.withdrawError.set(
            err?.message || 'Could not withdraw the trade.',
          ),
      });
  }

  reload(): void {
    this.leagueService
      .getTrades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const currentRoundIndex = data.currentRoundIndex ?? -1;
        const rounds = [...data.rounds]
          .filter((round) => round.trades.length)
          .reverse();
        this.currentRoundIndex.set(currentRoundIndex);
        this.tradeRounds.set(rounds);

        const trades = rounds.flatMap((round) => round.trades);
        this.summaryChange.emit({
          total: trades.length,
          pending: trades.filter((trade) => trade.status === 'PENDING').length,
          currentRoundName: data.rounds[currentRoundIndex]?.name,
        });
      });
  }
}
