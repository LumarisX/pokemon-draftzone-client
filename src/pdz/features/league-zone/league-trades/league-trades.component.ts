import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  LeagueTradeWidgetComponent,
  TradeSummary,
} from '@pdz/features/league-zone/league-widgets/league-trade-widget/league-trade-widget.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-league-trades',
  imports: [
    ChipComponent,
    LeagueTradeWidgetComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './league-trades.component.html',
  styleUrl: './league-trades.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTradesComponent {
  readonly summary = signal<TradeSummary | undefined>(undefined);
}
