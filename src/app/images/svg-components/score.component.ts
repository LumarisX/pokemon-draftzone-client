import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'score-svg',
  standalone: true,
  imports: [CommonModule],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full stroke-symbolColor-main"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-width="2"
      d="M4 9.5h16m-16 5h16M9 4.5v15m-1.8 0h9.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C20 17.98 20 17.42 20 16.3V7.7c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C18.48 4.5 17.92 4.5 16.8 4.5H7.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C4 6.02 4 6.58 4 7.7v8.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874c.428.218.988.218 2.108.218Z"
    />
  </svg>`,
})
export class ScoreSVG {
  constructor() {}
}
