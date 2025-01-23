import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Coverage } from '../../drafts/matchup-overview/matchup-interface';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { TYPES } from '../../data';

@Component({
  selector: 'planner-coverage',
  standalone: true,
  templateUrl: './coverage.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent],
})
export class PlannerCoverageComponent {
  @Input() coverage!: Coverage;
  types = TYPES;

  constructor() {}

  coverageColor(value: number | undefined): string | string[] {
    const MID = 7000;
    if (!value) return 'bg-scale-negative-7';
    if (value > MID + 7000) return 'bg-scale-positive-7';
    if (value > MID + 6000) return 'bg-scale-positive-6';
    if (value > MID + 5000) return 'bg-scale-positive-5';
    if (value > MID + 4000) return 'bg-scale-positive-4';
    if (value > MID + 3000) return 'bg-scale-positive-3';
    if (value > MID + 2000) return 'bg-scale-positive-2';
    if (value > MID + 1000) return 'bg-scale-positive-1';
    if (value > MID) return 'bg-gray-400';
    if (value > MID - 1000) return 'bg-scale-negative-1';
    if (value > MID - 2000) return 'bg-scale-negative-2';
    if (value > MID - 3000) return 'bg-scale-negative-3';
    if (value > MID - 4000) return 'bg-scale-negative-4';
    if (value > MID - 5000) return 'bg-scale-negative-5';
    if (value > MID - 6000) return 'bg-scale-negative-6';
    return 'bg-scale-negative-7';
  }
}
