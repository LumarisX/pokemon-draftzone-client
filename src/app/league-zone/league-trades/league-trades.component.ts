import { Component } from '@angular/core';
import {
  LeagueTradeComponent,
  TradeLog,
} from './league-trade/league-trade.component';
import { getRandomPokemon } from '../../data/namedex';

@Component({
  selector: 'pdz-league-trades',
  imports: [LeagueTradeComponent],
  templateUrl: './league-trades.component.html',
  styleUrl: './league-trades.component.scss',
})
export class LeagueTradesComponent {
  tradeLogs: TradeLog[] = [
    {
      from: {
        team: {
          teamName: `Mighty Murkrow`,
          coaches: ['hsoj'],
          logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
        },
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      to: {
        team: {
          teamName: `Deimos Deoxys`,
          coaches: ['Lumaris'],
          logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
        },
        pokemon: [
          { ...getRandomPokemon(), tier: Math.round(Math.random() * 20) },
        ],
      },
      activeStage: 'Week 4',
    },
  ];
}
