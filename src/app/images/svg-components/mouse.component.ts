import { Component } from '@angular/core';

@Component({
  selector: 'mouse-svg',
  standalone: true,
  template: `<svg
    class="w-full h-full stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 9V7m0 14a6 6 0 0 1-6-6V9a6 6 0 1 1 12 0v6a6 6 0 0 1-6 6"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class MouseSVG {}
