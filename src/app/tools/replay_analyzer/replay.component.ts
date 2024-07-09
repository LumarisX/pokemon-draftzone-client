import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReplayService } from '../../api/replay.service';
import { SpriteComponent } from '../../images/sprite.component';
import { getPidByName } from '../../pokemon';
import { ReplayData, ReplayMon } from './replay.interface';

@Component({
  selector: 'replay-analyzer',
  standalone: true,
  templateUrl: './replay.component.html',
  imports: [CommonModule, RouterModule, FormsModule, SpriteComponent],
})
export class ReplayComponent {
  private _replayURI: string =
    'https://replay.pokemonshowdown.com/gen9nationaldexubers-2156145657';
  replayData: ReplayData | undefined;
  analyzed: boolean = true;
  get replayURI() {
    return this._replayURI;
  }

  set replayURI(value) {
    this.analyzed = false;
    this._replayURI = value;
  }

  constructor(private replayService: ReplayService) {}

  analyze() {
    this.analyzed = true;
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

  getPID(name: string): string {
    return getPidByName(name) || '';
  }
}
