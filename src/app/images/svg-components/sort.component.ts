import { Component } from '@angular/core';

@Component({
  selector: 'sort-down-svg',
  standalone: true,
  imports: [],
  template: ` <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="stroke-symbolColor-main"
  >
    <path
      d="M13 12h8m-8-4h8m-8 8h8M6 7v10m0 0-3-3m3 3 3-3"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class SortDownSVG {
  constructor() {}
}
