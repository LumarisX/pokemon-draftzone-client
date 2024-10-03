import { Component } from '@angular/core';

@Component({
  selector: 'check-svg',
  standalone: true,
  template: ` <svg
    class="w-full h-full stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 12.611 8.923 17.5 20 6.5"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class CheckSVG {}
