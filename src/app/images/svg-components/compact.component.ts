import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'compact-svg',
  standalone: true,
  imports: [CommonModule],
  template: ` <svg
      viewBox="0 0 24 24"
      fill="none"
      [style.width.em]="iconSize"
      [style.height.em]="iconSize"
      class=" stroke-symbolColor-main"
      xmlns="http://www.w3.org/2000/svg"
      *ngIf="up"
    >
      <path
        d="m6 15 6-6 6 6"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      [style.width.em]="iconSize"
      [style.height.em]="iconSize"
      class="stroke-symbolColor-main"
      xmlns="http://www.w3.org/2000/svg"
      *ngIf="!up"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`,
})
export class CompactSVG {
  @Input()
  up: boolean = true;

  @Input()
  iconSize: number = 1; // default is 1em, you can adjust based on text size
}
