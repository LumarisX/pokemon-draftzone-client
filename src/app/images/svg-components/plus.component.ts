import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'plus-svg',
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
      d="M6 12h12m-6-6v12"
    />
  </svg>`,
})
export class PlusSVG {
  constructor() {}
}
