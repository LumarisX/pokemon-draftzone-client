import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { ReplayService } from '../../services/replay.service';
import { ReplayChartComponent } from './replay-chart/replay-chart.component';
import { ReplayAnalysis, ReplayPokemon } from './replay.interface';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'pdz-replay-analyzer',
  templateUrl: './replay.component.html',
  styleUrls: ['./replay.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IconComponent,
    SpriteComponent,
    ReplayChartComponent,
    MatExpansionModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
  ],
})
export class ReplayComponent implements OnInit {
  private replayService = inject(ReplayService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private _replayURI = '';
  replayData?: ReplayAnalysis;
  analyzed = true;
  showAdvancedDetails = false;
  analyzedReplayURI = '';

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
    this.analyzedReplayURI = replayURI;
    this._replayURI = '';
    this.replayService
      .analyzeReplay(replayURI)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.replayData = data.analysis;
        },
        error: () => {
          this.replayData = undefined;
          this.analyzed = false;
        },
      });
  }

  toggleAdvancedDetails(): void {
    this.showAdvancedDetails = !this.showAdvancedDetails;
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

  monStatusClass(status: ReplayPokemon['status']): string {
    if (status === 'fainted') {
      return 'replay-analyzer__mon-status--fainted';
    }

    if (status === 'survived') {
      return 'replay-analyzer__mon-status--survived';
    }

    return 'replay-analyzer__mon-status--brought';
  }
}
