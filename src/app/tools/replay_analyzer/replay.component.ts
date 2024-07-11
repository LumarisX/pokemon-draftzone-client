import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReplayService } from '../../api/replay.service';
import { SpriteComponent } from '../../images/sprite.component';
import { getPidByName } from '../../pokemon';
import { ReplayData, ReplayMon } from './replay.interface';
import { ReplayChartComponent } from './replay-chart/replay-chart.component';

@Component({
  selector: 'replay-analyzer',
  standalone: true,
  templateUrl: './replay.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    ReplayChartComponent,
  ],
})
export class ReplayComponent {
  private _replayURI: string = '';
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
