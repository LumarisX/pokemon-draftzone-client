import { Component } from '@angular/core';
import {
  LeagueTradeComponent,
  TradeLog,
} from './league-trade/league-trade.component';
import { getRandomPokemon } from '../../data/namedex';
import { getRandomTeamOrder } from '../league-ghost';

@Component({
  selector: 'pdz-league-trades',
  imports: [LeagueTradeComponent],
  templateUrl: './league-trades.component.html',
  styleUrl: './league-trades.component.scss',
})
export class LeagueTradesComponent {
  teams = getRandomTeamOrder();
  tradeLogs: TradeLog[] = [
    {
      from: {
        team: this.teams[1],
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      to: {
        team: this.teams[2],
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      activeStage: 'Week 4',
    },
    {
      from: {
        team: this.teams[0],
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      to: {
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      activeStage: 'Week 4',
    },
    {
      from: {
        team: this.teams[3],
      },
      to: {
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },

      activeStage: 'Week 4',
    },
  ];
}
