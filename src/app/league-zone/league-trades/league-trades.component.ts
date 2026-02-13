import { Component } from '@angular/core';

import { getRandomPokemon } from '../../data/namedex';
import { getRandomTeamOrder } from '../league-ghost';
import { TradeLog } from '../league.interface';
import { TradeCardComponent } from './trade-card/trade-card.component';

@Component({
  selector: 'pdz-league-trades',
  imports: [TradeCardComponent],
  templateUrl: './league-trades.component.html',
  styleUrls: ['./league-trades.component.scss'],
})
export class LeagueTradesComponent {
  teams = getRandomTeamOrder();
  tradeLogs: TradeLog[] = [
    {
      from: {
        team: this.teams[1],
        pokemon: [
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
        ],
      },
      to: {
        team: this.teams[2],
        pokemon: [
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
        ],
      },
      activeStage: 'Week 4',
    },
    {
      from: {
        team: this.teams[0],
        pokemon: [
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
        ],
      },
      to: {
        pokemon: [
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
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
          {
            ...getRandomPokemon(),
            tier: Math.round(Math.random() * 20).toFixed(0),
            cost: Math.round(Math.random() * 10),
          },
        ],
      },

      activeStage: 'Week 4',
    },
  ];
}
