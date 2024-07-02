import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReplayService } from '../../api/replay.service';

type Team = {
  name: string;
  kills: [number, number];
  damageDealt: number;
  damageTaken: number;
  hpRestored: number;
  fainted: boolean;
  brought: boolean;
};

@Component({
  selector: 'replay-analyzer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './replay.component.html',
})
export class ReplayComponent {
  replayURI: string =
    'https://replay.pokemonshowdown.com/gen9doublescustomgame-2154029628';
  replayData:
    | {
        gametype: string;
        genNum: number;
        turns: number;
        gameTime: number;
        stats: {
          username: undefined | string;
          totalKills: number;
          totalDeaths: number;
          team: Team[];
          win: boolean;
        }[];
        events: { player: number; turn: number; message: string }[];
      }
    | undefined;
  constructor(private replayService: ReplayService) {}

  analyze() {
    this.replayService
      .analyzeReplay(this.replayURI)
      .subscribe((data) => (this.replayData = data));
  }

  remainingSeconds(seconds: number) {
    return Math.floor(seconds % 60);
  }

  toMinutes(seconds: number) {
    return Math.floor(seconds / 60);
  }

  monString(mon: Team) {
    let teamString = `${mon.name}: `;
    teamString +=
      mon.kills[1] > 0
        ? `${mon.kills[0]} Direct Kills, ${mon.kills[1]} Indirect Kills`
        : `${mon.kills[0]} Kills`;
    teamString += mon.fainted ? `, Fainted` : '';
    return teamString;
  }

  playerClass(index: number) {
    if (index === 1) {
      return 'bg-cyan-200';
    }
    if (index === 2) {
      return 'bg-red-200';
    }

    return '';
  }
}
