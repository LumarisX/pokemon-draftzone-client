import { Component } from '@angular/core';

@Component({
  selector: 'circle-svg',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class="w-full h-full stroke-symbolColor-main"
      fill="none"
    >
      <path
        d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `,
})
export class CircleSVG {}
