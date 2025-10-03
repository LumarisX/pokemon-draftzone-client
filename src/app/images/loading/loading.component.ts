import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'pdz-loading',
  imports: [CommonModule],
  templateUrl: 'loading.component.html',
  styleUrl: 'loading.component.scss',
})
export class LoadingComponent implements OnInit {
  readonly numPairs = 12;
  readonly animDuration = 2;
  readonly waveDelay = Math.sqrt(2);

  circles!: { cx: number; delay: number; className: string }[];

  ngOnInit() {
    this.circles = [];
    for (let i = 0; i < this.numPairs; i++) {
      const cx = 5 + (90 / this.numPairs) * i;

      this.circles.push({
        cx: cx,
        className: 'circle-primary',
        delay: -(this.animDuration / this.numPairs) * i,
      });

      this.circles.push({
        cx: cx,
        className: 'circle-secondary',
        delay: -(this.animDuration / this.numPairs) * i - this.waveDelay,
      });
    }
  }
}
