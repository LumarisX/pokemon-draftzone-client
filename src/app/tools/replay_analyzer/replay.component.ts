import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { ReplayService } from '../../services/replay.service';
import { ReplayChartComponent } from './replay-chart/replay-chart.component';
import { ReplayAnalysis, ReplayPlayer } from './replay.interface';

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
  ],
})
export class ReplayComponent implements OnInit {
  private readonly advancedDetailsStorageKey =
    'pdz.replayAnalyzer.showAdvancedDetails';
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
    this.showAdvancedDetails = this.loadAdvancedDetailsPreference();

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
    this.storeAdvancedDetailsPreference(this.showAdvancedDetails);
  }

  private loadAdvancedDetailsPreference(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return (
        window.localStorage.getItem(this.advancedDetailsStorageKey) === 'true'
      );
    } catch {
      return false;
    }
  }

  private storeAdvancedDetailsPreference(enabled: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        this.advancedDetailsStorageKey,
        String(enabled),
      );
    } catch {
      // Ignore storage errors to keep the toggle functional.
    }
  }

  remainingSeconds(seconds: number): number {
    return Math.floor(seconds % 60);
  }

  toMinutes(seconds: number): number {
    return Math.floor(seconds / 60);
  }

  validateKills(player: ReplayPlayer) {
    return (
      player.total.kills ===
      this.replayData?.players
        .filter((p) => p.username !== player.username)
        .reduce((sum, p) => sum + p.total.deaths, 0)
    );
  }

  validateDeaths(player: ReplayPlayer) {
    return (
      player.total.deaths ===
      this.replayData?.players
        .filter((p) => p.username !== player.username)
        .reduce((sum, p) => sum + p.total.kills, 0)
    );
  }
}
