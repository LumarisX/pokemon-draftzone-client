import { Component } from '@angular/core';
import { getRandomPokemon } from '../../data/namedex';
import { defenseData } from '../league-ghost';
import {
  LeagueTeamCardComponent,
  TeamPokemon,
} from './league-team-card/league-team-card.component';

@Component({
  selector: 'pdz-league-teams',
  imports: [LeagueTeamCardComponent],
  templateUrl: './league-teams.component.html',
  styleUrl: './league-teams.component.scss',
})
export class LeagueTeamsComponent {
  teams = defenseData.map((team) => {
    const roster: TeamPokemon[] = [];
    const pokemonCount = Math.round(Math.random() * 2) + 10;
    for (let i = 0; i < pokemonCount; i++) {
      const brought = Math.round(Math.random() * 8);
      const kills = Math.round(Math.random() * 20);
      const deaths = Math.round(Math.random() * 20);
      const tera = Math.round(Math.random() * 6) ? undefined : [];
      const z = Math.round(Math.random() * 6) ? undefined : [];
      const dmax = Math.round(Math.random() * 6) === 0;

      roster.push({
        ...getRandomPokemon(),
        tier: Math.round(Math.random() * 20),
        record: {
          brought,
          kills,
          deaths,
        },
        capt: {
          tera,
          z,
          dmax,
        },
      });
    }

    const wins = Math.round(Math.random() * 8);
    const diff = Math.round(Math.random() * 20) - 10;

    return {
      ...team,
      roster,
      timezone: 'EST/EDT',
      record: {
        wins,
        losses: 8 - wins,
        diff,
      },
    };
  });
}
