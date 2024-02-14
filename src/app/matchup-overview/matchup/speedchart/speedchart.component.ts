import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SpeedChart, Speedtier } from '../../matchup-interface';
import { MatchupService } from '../../../api/matchup.service';

@Component({
  selector: 'speedchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speedchart.component.html',
})
export class SpeedchartComponent implements OnInit {
  @Input() matchupId!: string;
  speedchart!: SpeedChart;

  constructor(private matchupService: MatchupService) {}

  ngOnInit() {
    this.matchupService.getSpeedchart(this.matchupId).subscribe((data) => {
      this.speedchart = <SpeedChart>data;
      this.speedchart.tiers.sort(this.sortTiers);
      this.makeSticky(this.speedchart);
    });
    document.getElementById('base')!.scrollIntoView();
  }

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

  makeSticky(speedchart: SpeedChart) {
    for (let i = 0; i < speedchart.tiers.length - 1; i++) {
      if (speedchart.tiers[i].team != speedchart.tiers[i + 1].team) {
        speedchart.tiers[i].stick = true;
      }
    }
  }

  filtered(tier: Speedtier) {
    let bad = [
      'Stage 2',
      'scarf',
      'tailwind',
      'Unburden',
      'Quick Feet',
      'Stage 1',
      'Stage -1',
      'paralyzed',
      'base',
      'min-',
      'ironball',
    ];
    for (let mod of bad) {
      if (tier.modifiers.includes(mod)) return false;
    }
    return true;
  }
}
