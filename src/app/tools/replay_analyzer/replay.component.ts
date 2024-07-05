import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReplayData, ReplayMon } from './replay.interface';
import { ReplayService } from '../../api/replay.service';

@Component({
  selector: 'replay-analyzer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './replay.component.html',
})
export class ReplayComponent {
  replayURI: string = '';
  replayData: ReplayData | undefined;
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

  monString(mon: ReplayMon) {
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
      return 'bg-aTeam-200';
    }
    if (index === 2) {
      return 'bg-bTeam-200';
    }

    return '';
  }
}
