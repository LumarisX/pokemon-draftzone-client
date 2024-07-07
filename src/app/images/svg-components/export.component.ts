import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'export-svg',
  standalone: true,
  imports: [CommonModule],
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
      d="M8 5c-.988 0-1.506.013-1.908.218a2 2 0 0 0-.874.874C5 6.52 5 7.08 5 8.2v9.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C6.52 21 7.08 21 8.2 21h7.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C19 19.48 19 18.92 19 17.8V8.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874c-.402-.205-.92-.217-1.908-.218M8 5v2h8V5M8 5v-.293A1.707 1.707 0 0 1 9.707 3h4.586A1.707 1.707 0 0 1 16 4.707V5m-4 6v6m0-6 2 2m-2-2-2 2"
    />
  </svg>`,
})
export class ExportSVG {
  constructor() {}
}
