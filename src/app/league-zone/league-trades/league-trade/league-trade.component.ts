import { Component, Input } from '@angular/core';
import { League } from '../../league.interface';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { MatIconModule } from '@angular/material/icon';

type Trade = {
  team?: League.Team;
  pokemon?: League.Pokemon[];
};

export type TradeLog = {
  from: Trade;
  to: Trade;
  activeStage: string;
};

@Component({
  selector: 'pdz-league-trade',
  imports: [SpriteComponent, MatIconModule],
  templateUrl: './league-trade.component.html',
  styleUrl: './league-trade.component.scss',
})
export class LeagueTradeComponent {
  @Input()
  tradeLog!: TradeLog;
}
