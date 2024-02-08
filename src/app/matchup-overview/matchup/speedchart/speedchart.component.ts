import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Speedtier } from '../../matchup-interface';
import { MatchupService } from '../../../api/matchup.service';

@Component({
  selector: 'speedchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speedchart.component.html',
})
export class SpeedchartComponent implements OnInit {
  @Input() matchupId!: string;
  speedchart!: Speedtier[];

  constructor(
    private matchupService: MatchupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.matchupService.getSpeedchart(this.matchupId).subscribe((data) => {
      let [a, b] = <Speedtier[][]>data;
      this.speedchart = this.sortTiers(a, b);
      this.makeSticky(this.speedchart);
      this.setBase(this.speedchart);
    });
    document.getElementById('base')!.scrollIntoView();
  }

  speedClasses(tier: Speedtier | null) {
    let classes = [];
    if (tier?.team) classes.push('bg-cyan-400');
    else classes.push('bg-red-400');
    if (tier != undefined && tier.stick) {
      classes.push('sticky');
      classes.push('top-0');
      classes.push('z-1');
    }
    if (tier != undefined && tier.base) {
      classes.push('base');
    }
    return classes;
  }

  sortTiers(a: Speedtier[], b: Speedtier[]): Speedtier[] {
    let out = [];
    let ai = 0;
    let bi = 0;
    for (let i = 0; i < a.length + b.length; i++) {
      if (ai < a.length && (bi >= b.length || a[ai].speed > b[bi].speed)) {
        a[ai]['team'] = true;
        out.push(a[ai++]);
      } else {
        b[bi]['team'] = false;
        out.push(b[bi++]);
      }
    }
    return out;
  }

  makeSticky(speedchart: Speedtier[]) {
    for (let i = 0; i < speedchart.length - 1; i++) {
      if (speedchart[i].team != speedchart[i + 1].team) {
        speedchart[i].stick = true;
      }
    }
  }

  setBase(speedchart: Speedtier[]) {
    let slowest: Speedtier | null = null;
    for (let tier of speedchart) {
      if (tier.modifiers.length == 1 && tier.modifiers[0] == 'max+') {
        if (slowest == null || slowest.speed > tier.speed) {
          slowest = tier;
        }
      }
    }
    if (slowest != null) {
      slowest.base = true;
    }
  }
}
