import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'gear-svg',
  standalone: true,
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
      d="m18.763 13.794 1.266 2.228a9.084 9.084 0 0 1-1.1 1.67l-2.491-.278a6.988 6.988 0 0 1-2.273 1.245L13 20.945a9.097 9.097 0 0 1-2 0l-1.167-2.287a6.988 6.988 0 0 1-2.274-1.247l-2.505.28a9.093 9.093 0 0 1-1.1-1.67l1.272-2.24A7.05 7.05 0 0 1 5 12.001c0-.626.082-1.232.236-1.809L3.954 7.936a9.099 9.099 0 0 1 1.1-1.67l2.555.287A6.94 6.94 0 0 1 9.84 5.34m-.004 0L11 3.055a9.097 9.097 0 0 1 2 0l1.164 2.285a6.94 6.94 0 0 1 2.234 1.21l2.53-.283a9.113 9.113 0 0 1 1.1 1.67L18.76 10.17m0 .003A7.01 7.01 0 0 1 19 12c0 .621-.08 1.224-.233 1.797M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>`,
})
export class GearSVG {}
