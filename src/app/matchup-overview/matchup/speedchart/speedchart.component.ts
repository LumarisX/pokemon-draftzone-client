import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SpeedChart, Speedtier } from '../../matchup-interface';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'speedchart',
  standalone: true,
  templateUrl: './speedchart.component.html',
  imports: [CommonModule, FormsModule, SpriteComponent],
})
export class SpeedchartComponent {
  @Input() speedchart!: SpeedChart | null;
  @Input() level = 100;
  showFilter: boolean = false;

  modifiers: {
    [key: string]: boolean;
  } = {
    '252': true,
    Positive: true,
    '0': true,
    Negative: true,
    'Swift Swim': true,
    'Sand Rush': true,
    Chlorophyll: true,
    'Slush Rush': true,
    Protosynthesis: true,
    'Quark Drive': true,
  };

  constructor() {}

  speedClasses(tier: Speedtier) {
    let classes = [];
    if (tier.team == 0) classes.push('bg-cyan-400');
    else classes.push('bg-red-400');
    if (tier != undefined && tier.stick) {
      classes.push('sticky');
      classes.push('top-0');
      classes.push('z-1');
    }
    return classes;
  }

  sortTiers(a: Speedtier, b: Speedtier): number {
    if (a.speed > b.speed) return -1;
    if (a.speed < b.speed) return 1;
    return 0;
  }

  // makeSticky(speedchart: SpeedChart) {
  //   for (let i = 0; i < speedchart.tiers.length - 1; i++) {
  //     if (speedchart.tiers[i].team != speedchart.tiers[i + 1].team) {
  //       speedchart.tiers[i].stick = true;
  //     }
  //   }
  // }

  filtered(tier: Speedtier) {
    for (let mod of tier.modifiers) {
      if (mod in this.modifiers) {
        if (!this.modifiers[mod]) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
}
