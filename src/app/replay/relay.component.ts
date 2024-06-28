import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReplayService } from '../api/replay.service';

type Team = {
  detail: string;
  nickname: string;
  pid: string;
  hpp: number;
  kills: [number, number];
  damageDealt: number;
  damageTaken: number;
  hpRestored: number;
  fainted: boolean;
  brought: boolean;
};

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './replay.component.html',
})
export class ReplayComponent {
  replayURI: string = '';
  replayData:
    | {
        gametype: string;
        genNum: number;
        turns: number;
        gameTime: number;
        stats: {
          username: undefined | string;
          teamSize: undefined | number;
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
    let teamString = `${mon.detail.split(',')[0]}: `;
    teamString +=
      mon.kills[1] > 0
        ? `${mon.kills[0]} Direct Kills, ${mon.kills[1]} Indirect Kills`
        : `${mon.kills[0]} Kills`;
    teamString += mon.fainted ? `, Fainted` : '';
    return teamString;
  }
}
