import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReplayService } from '../../services/replay.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { ReplayChartComponent } from './replay-chart/replay-chart.component';
import { ReplayData } from './replay.interface';
import { getNameByPid } from '../../data/namedex';

import { MatGridListModule } from '@angular/material/grid-list'
 
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
    
    MatGridListModule,
  ],
})
export class ReplayComponent implements OnInit {
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);

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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if ('replay' in params) {
        this.replayURI = decodeURIComponent(params['replay']);
        this.analyze();
        this.analyzed = true;
      }
    });
  }

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

  getNameByPid(pid: string) {
    return getNameByPid(pid);
  }
}
