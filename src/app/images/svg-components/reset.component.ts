import { Component } from '@angular/core';

@Component({
  selector: 'reset-svg',
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    class="stroke-symbolColor-main"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.938 13q.062-.492.062-1A8 8 0 0 0 5.8 6.944M4.062 11Q4 11.492 4 12a8 8 0 0 0 14 5.292M15 17h3v.292M5.8 4v2.944m0 0V7h3M18 20v-2.708"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class ResetSVG {}
