import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'minus-svg',
  standalone: true,
  imports: [CommonModule],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="stroke-symbolColor-main"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M6 12h12"
    />
  </svg>`,
})
export class MinusSVG {
  constructor() {}
}
