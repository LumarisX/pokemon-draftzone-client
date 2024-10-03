import { Component } from '@angular/core';

@Component({
  selector: 'copy-svg',
  standalone: true,
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="stroke-symbolColor-main"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linejoin="round"
      stroke-width="2"
      d="M15 3v3.4c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C15.76 8 16.04 8 16.6 8H20M10 8H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3m2-13h-2.8c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C10 4.52 10 5.08 10 6.2v6.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C11.52 16 12.08 16 13.2 16h3.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C20 14.48 20 13.92 20 12.8V7l-4-4Z"
    />
  </svg>`,
})
export class CopySVG {}
