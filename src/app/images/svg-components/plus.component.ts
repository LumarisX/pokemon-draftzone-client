import { Component } from '@angular/core';

@Component({
  selector: 'plus-svg',
  standalone: true,
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full"
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
export class PlusSVG {}
