import { Component, signal } from '@angular/core';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import {
  LeagueTradeWidgetComponent,
  TradeSummary,
} from '../league-widgets/league-trade-widget/league-trade-widget.component';

@Component({
  selector: 'pdz-league-trades',
  imports: [ChipComponent, LeagueTradeWidgetComponent, PageHeaderComponent],
  templateUrl: './league-trades.component.html',
  styleUrls: ['./league-trades.component.scss'],
})
export class LeagueTradesComponent {
  readonly summary = signal<TradeSummary | undefined>(undefined);
}
