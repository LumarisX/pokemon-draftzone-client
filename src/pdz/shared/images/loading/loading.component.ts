import { Component, OnInit, input } from '@angular/core';

@Component({
  selector: 'pdz-loading',
  imports: [],
  templateUrl: 'loading.component.html',
  styleUrl: 'loading.component.scss',
})
export class LoadingComponent implements OnInit {
  readonly numPairs = input<number>(12);
  readonly animDuration = input<number>(2);
  readonly waveDelay = input<number>(1);

  circles!: { cx: number; delay: number; className: string }[];

  ngOnInit() {
    this.circles = [];
    const primary = [];
    const secondary = [];
    for (let i = 0; i < this.numPairs(); i++) {
      const cx = 5 + (90 / this.numPairs()) * i;

      const numPairs = this.numPairs();
      const animDuration = this.animDuration();
      primary.push({
        cx: cx,
        className: 'circle-primary',
        delay: -(animDuration / numPairs) * i,
      });

      secondary.push({
        cx: cx,
        className: 'circle-secondary',
        delay: -(animDuration / numPairs) * i - this.waveDelay(),
      });
    }
    const middleIndex = Math.ceil(this.numPairs() / 2);
    this.circles = [
      ...primary.slice(0, middleIndex),
      ...secondary,
      ...primary.slice(middleIndex),
    ];
  }
}
