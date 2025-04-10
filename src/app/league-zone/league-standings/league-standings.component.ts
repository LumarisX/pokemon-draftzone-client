import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlusSignPipe } from '../../util/pipes/plus-sign.pipe';

@Component({
  selector: 'app-league-standings',
  imports: [CommonModule, MatIconModule, PlusSignPipe],
  templateUrl: './league-standings.component.html',
  styleUrl: './league-standings.component.scss',
})
export class LeagueStandingsComponent {
  standingData: {
    cutoff: number;
    weeks: 0[];
    teams: {
      rank: number;
      name: string;
      results: number[];
      coaches: string[];
      streak: number;
      direction: number;
      wins: number;
      loses: number;
      diff: number;
      logo?: string;
    }[];
  } = {
    cutoff: 8,
    weeks: Array(8).fill(0),
    teams: [
      {
        name: `Philadelphia Flygons`,
        results: [4, 6, 4, 2, -4, 5],
        rank: 1,
        coaches: ['02ThatOneGuy'],
        direction: 0,
      },
      {
        name: `Mighty Murkrow`,
        results: [6, 4, 2, 4, -4, -2],
        rank: 2,
        coaches: ['hsoj'],
        direction: 0,
        logo: 'MightyMurkrows.png',
      },
      {
        name: `Fitchburg's Sun Chasers`,
        results: [2, -2, 4, 2, -3, 6],
        rank: 3,
        coaches: ['Feather'],
        direction: 0,
      },
      {
        name: `Chicago White Fox`,
        results: [3, 2, -2, 4, 4, -2],
        rank: 3,
        coaches: ['TheNotoriousABS'],
        direction: 1,
      },
      {
        name: `Deimos Deoxys`,
        results: [-2, -2, 2, 2, 4, 3],
        rank: 5,
        coaches: ['Lumaris'],
        direction: 0,
        logo: 'DeimosDeoxys.png',
      },
      {
        name: `Alpine Arcanines`,
        results: [5, -4, 4, -3, 3, 2],
        rank: 5,
        coaches: ['Lion'],
        direction: 1,
      },
      {
        name: `Victorious Vigoroths`,
        results: [1, 2, -2, 3, -2, 3],
        rank: 7,
        coaches: ['Speedy'],
        direction: -1,
        logo: 'Victorious_Vigoroths.png',
      },
      {
        name: `Deep Sea Duskulls`,
        results: [-6, 5, 2, 4, -2, 2],
        rank: 8,
        coaches: ['Emeglebon'],
        direction: 0,
      },
      {
        name: `Twinleaf Tatsugiri`,
        results: [-1, -4, -4, 1, 4, 2],
        rank: 9,
        coaches: ['Penic'],
        direction: 0,
      },
      {
        name: `I like 'em THICC`,
        results: [-3, -5, 3, -2, 2, 2],
        rank: 10,
        coaches: ['Kat'],
        direction: 0,
      },
      {
        name: `London Vespiquens`,
        results: [1, 2, -4, -4, 4, -5],
        rank: 11,
        coaches: ['Jake W'],
        direction: 0,
      },
      {
        name: `Tampa T-Chainz`,
        results: [5, 4, -3, -2, -4],
        rank: 12,
        coaches: ['Spite'],
        direction: -1,
      },
      {
        name: `Kalos Quagsires`,
        results: [-5, -2, 4, -2, -2],
        rank: 13,
        coaches: ['Caltech_'],
        direction: 1,
      },
      {
        name: `Montreal Mean Mareanies`,
        results: [-1, 2, 0, -4, -4, -3],
        rank: 14,
        coaches: ['Qofol'],
        direction: 0,
      },
      {
        name: `Chicago Sky Attack`,
        results: [-4, -2, -4, -1, 2, -3],
        rank: 15,
        coaches: ['Quincy'],
        direction: 0,
      },
      {
        name: `Midnight Teddy's`,
        results: [-5, -6, -2, -4, -2, -6],
        rank: 16,
        coaches: ['neb5'],
        direction: 0,
      },
    ].map((team) => ({
      ...team,
      streak: team.results.reduce((streak, result) => {
        if (result > 0 && streak >= 0) return ++streak;
        if (result < 0 && streak <= 0) return --streak;
        if (result > 0) return 1;
        if (result < 0) return -1;
        return 0;
      }, 0),
      ...team.results.reduce(
        (resultsData, result) => {
          if (result > 0) resultsData.wins++;
          if (result < 0) resultsData.loses++;
          resultsData.diff += result;
          return resultsData;
        },
        { wins: 0, loses: 0, diff: 0 },
      ),
    })),
  };

  getGradientStyle(index: number, total: number): { [klass: string]: any } {
    const startColor = [144, 238, 144]; // lightgreen
    const midColor = [255, 255, 255]; // white
    const endColor = [240, 128, 128]; // lightcoral
    const midpointIndex = this.standingData.cutoff;
    let from: number[], to: number[], ratio: number;

    if (index <= midpointIndex) {
      from = startColor;
      to = midColor;
      ratio = midpointIndex > 0 ? index / midpointIndex : 0;
    } else {
      from = midColor;
      to = endColor;
      ratio = (index - midpointIndex) / (total - 1 - midpointIndex);
    }

    const r = Math.round(from[0] + (to[0] - from[0]) * ratio);
    const g = Math.round(from[1] + (to[1] - from[1]) * ratio);
    const b = Math.round(from[2] + (to[2] - from[2]) * ratio);

    return { 'border-color': `rgb(${r}, ${g}, ${b})` };
  }
}
