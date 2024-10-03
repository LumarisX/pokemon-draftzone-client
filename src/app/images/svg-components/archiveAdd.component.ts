import { Component } from '@angular/core';

@Component({
  selector: 'archive-add-svg',
  standalone: true,
  imports: [],
  template: `<svg
    class="w-full h-full stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 12.5v5m0 0 2-2m-2 2-2-2M9 10h10.4c.56 0 .84 0 1.054-.109a1 1 0 0 0 .437-.437C21 9.24 21 8.96 21 8.4V5.6c0-.56 0-.84-.109-1.054a1 1 0 0 0-.437-.437C20.24 4 19.96 4 19.4 4H4.6c-.56 0-.84 0-1.054.109a1 1 0 0 0-.437.437C3 4.76 3 5.04 3 5.6v2.8c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C3.76 10 4.04 10 4.6 10Zm-4 0h14v6.8c0 1.12 0 1.68-.218 2.108a2 2 0 0 1-.874.874C17.48 20 16.92 20 15.8 20H8.2c-1.12 0-1.68 0-2.108-.218a2 2 0 0 1-.874-.874C5 18.48 5 17.92 5 16.8z"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class ArchiveAddSVG {}
