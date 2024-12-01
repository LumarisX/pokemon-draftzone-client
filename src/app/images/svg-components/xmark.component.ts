import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'xmark-svg',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      class="stroke-symbolColor-main"
      [style.width.em]="iconSize"
      [style.height.em]="iconSize"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m6 6 12 12m0-12L6 18"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class XMarkSVG {
  @Input()
  iconSize: number = 1;
}
