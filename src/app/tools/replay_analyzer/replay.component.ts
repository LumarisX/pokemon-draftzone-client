import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReplayService } from '../../services/replay.service';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { ReplayChartComponent } from './replay-chart/replay-chart.component';
import { ReplayData } from './replay.interface';
import { getNameByPid } from '../../data/namedex';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'pdz-replay-analyzer',
  templateUrl: './replay.component.html',
  styleUrls: ['./replay.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    ReplayChartComponent,
    MatExpansionModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayComponent implements OnInit {
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private _replayURI = '';
  replayData: ReplayData | undefined;
  analyzed = true;

  get replayURI(): string {
    return this._replayURI;
  }

  set replayURI(value: string) {
    this.analyzed = false;
    this._replayURI = value;
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if ('replay' in params && typeof params['replay'] === 'string') {
          this.replayURI = decodeURIComponent(params['replay']);
          this.analyze();
        }
      });
  }

  analyze(): void {
    const replayURI = this.replayURI.trim();
    if (!replayURI) {
      this.analyzed = false;
      this.replayData = undefined;
      return;
    }

    this.analyzed = true;
    this.replayService
      .analyzeReplay(replayURI)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.replayData = data;
        },
        error: () => {
          this.replayData = undefined;
          this.analyzed = false;
        },
      });
  }

  remainingSeconds(seconds: number): number {
    return Math.floor(seconds % 60);
  }

  toMinutes(seconds: number): number {
    return Math.floor(seconds / 60);
  }

  playerClass(index: number): string {
    if (index === 1) {
      return 'replay-analyzer__player--team-a';
    }
    if (index === 2) {
      return 'replay-analyzer__player--team-b';
    }

    return '';
  }

  getNameByPid(pid: string): string {
    return getNameByPid(pid);
  }
}
