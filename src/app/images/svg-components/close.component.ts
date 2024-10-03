import { Component } from '@angular/core';

@Component({
  selector: 'close-svg',
  standalone: true,
  imports: [],
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
      d="m9 9 6 6m0-6-6 6m12-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>`,
})
export class CloseSVG {}
