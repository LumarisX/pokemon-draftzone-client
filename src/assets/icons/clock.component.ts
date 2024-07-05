import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'clock-svg',
  standalone: true,
  imports: [CommonModule],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full stroke-symbolColor-main"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M12 7v5l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>`,
})
export class ClockSVG {
  constructor() {}
}
