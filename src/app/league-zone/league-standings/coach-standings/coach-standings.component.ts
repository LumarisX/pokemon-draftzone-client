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
    const startColor = [144, 238, 144]; // lightgreen
    const midColor = [255, 255, 255]; // white
    const endColor = [240, 128, 128]; // lightcoral
    const midpointIndex = this.standingData.cutoff;
    let from: number[], to: number[], ratio: number;

    if (index <= midpointIndex) {
      from = startColor;
      to = midColor;
      ratio = midpointIndex > 0 ? index / midpointIndex : 0;
    } else {
      from = midColor;
      to = endColor;
      ratio = (index - midpointIndex) / (total - 1 - midpointIndex);
    }

    const r = Math.round(from[0] + (to[0] - from[0]) * ratio);
    const g = Math.round(from[1] + (to[1] - from[1]) * ratio);
    const b = Math.round(from[2] + (to[2] - from[2]) * ratio);

    return { 'border-color': `rgb(${r}, ${g}, ${b})` };
  }

  getLogoUrl = getLogoUrl;
}
