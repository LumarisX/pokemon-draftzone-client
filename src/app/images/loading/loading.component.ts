import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'pdz-loading',
  imports: [CommonModule],
  templateUrl: 'loading.component.html',
  styleUrl: 'loading.component.scss',
})
export class LoadingComponent implements OnInit {
  @Input()
  numPairs: number = 12;
  @Input()
  animDuration: number = 2;
  @Input()
  waveDelay: number = 1;

  circles!: { cx: number; delay: number; className: string }[];

  ngOnInit() {
    this.circles = [];
    const primary = [];
    const secondary = [];
    for (let i = 0; i < this.numPairs; i++) {
      const cx = 5 + (90 / this.numPairs) * i;

      primary.push({
        cx: cx,
        className: 'circle-primary',
        delay: -(this.animDuration / this.numPairs) * i,
      });

      secondary.push({
        cx: cx,
        className: 'circle-secondary',
        delay: -(this.animDuration / this.numPairs) * i - this.waveDelay,
      });
    }
    const middleIndex = Math.ceil(this.numPairs / 2);
    this.circles = [
      ...primary.slice(0, middleIndex),
      ...secondary,
      ...primary.slice(middleIndex),
    ];
  }
}
