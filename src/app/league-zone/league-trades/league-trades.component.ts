import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { LeagueTradeWidgetComponent } from '../league-widgets/league-trade-widget/league-trade-widget.component';

@Component({
  selector: 'pdz-league-trades',
  imports: [RouterModule, IconComponent, LeagueTradeWidgetComponent],
  templateUrl: './league-trades.component.html',
  styleUrls: ['./league-trades.component.scss'],
})
export class LeagueTradesComponent {}
