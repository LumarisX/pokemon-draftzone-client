import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LeagueTradeWidgetComponent } from '../league-widgets/league-trade-widget/league-trade-widget.component';

@Component({
  selector: 'pdz-league-trades',
  imports: [
    RouterModule,
    ButtonComponent,
    IconComponent,
    LeagueTradeWidgetComponent,
  ],
  templateUrl: './league-trades.component.html',
  styleUrls: ['./league-trades.component.scss'],
})
export class LeagueTradesComponent {}
