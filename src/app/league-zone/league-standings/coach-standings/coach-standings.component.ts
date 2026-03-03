import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PlusSignPipe } from '../../../util/pipes/plus-sign.pipe';
import { League } from '../../league.interface';
import { getLogoUrl, getLogoUrlOld } from '../../league.util';

@Component({
  selector: 'pdz-coach-standings',
  imports: [CommonModule, MatIconModule, PlusSignPipe],
  templateUrl: './coach-standings.component.html',
  styleUrls: ['./coach-standings.component.scss'],
})
export class CoachStandingsComponent {
  @Input({ required: true }) standingData!: League.CoachStandingData;

  get weekRange(): number[] {
    return Array.from({ length: this.standingData.weeks }, (_, i) => i);
  }

  getGradientStyle(index: number, total: number): { [klass: string]: any } {
    const midpointIndex = this.standingData.cutoff;
    let fromColor: string;
    let toColor: string;
    let toPercent: number;

    if (index <= midpointIndex) {
      fromColor = 'var(--pdz-color-positive)';
      toColor = 'var(--pdz-color-surface)';
      toPercent = midpointIndex > 0 ? (index / midpointIndex) * 100 : 0;
    } else {
      const denominator = Math.max(total - 1 - midpointIndex, 1);
      fromColor = 'var(--pdz-color-surface)';
      toColor = 'var(--pdz-color-negative)';
      toPercent = ((index - midpointIndex) / denominator) * 100;
    }

    const clampedToPercent = Math.max(0, Math.min(100, Math.round(toPercent)));
    const fromPercent = 100 - clampedToPercent;

    return {
      'background-color': `color-mix(in srgb, ${fromColor} ${fromPercent}%, ${toColor} ${clampedToPercent}%)`,
    };
  }

  getDiffValue(team: League.TeamStandingData): number {
    return this.standingData.diffMode === 'game'
      ? team.gameDiff
      : team.pokemonDiff;
  }

  getLogoUrl = getLogoUrl;
}
