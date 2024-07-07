import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'barchart-svg',
  standalone: true,
  imports: [CommonModule],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full stroke-symbolColor-main"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 14.6c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C3.76 13 4.04 13 4.6 13h.8c.56 0 .84 0 1.054.109a1 1 0 0 1 .437.437C7 13.76 7 14.04 7 14.6v4.8c0 .56 0 .84-.109 1.054a1 1 0 0 1-.437.437C6.24 21 5.96 21 5.4 21h-.8c-.56 0-.84 0-1.054-.109a1 1 0 0 1-.437-.437C3 20.24 3 19.96 3 19.4v-4.8ZM10 4.6c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C10.76 3 11.04 3 11.6 3h.8c.56 0 .84 0 1.054.109a1 1 0 0 1 .437.437C14 3.76 14 4.04 14 4.6v14.8c0 .56 0 .84-.109 1.054a1 1 0 0 1-.437.437C13.24 21 12.96 21 12.4 21h-.8c-.56 0-.84 0-1.054-.109a1 1 0 0 1-.437-.437C10 20.24 10 19.96 10 19.4V4.6ZM17 10.6c0-.56 0-.84.109-1.054a1 1 0 0 1 .437-.437C17.76 9 18.04 9 18.6 9h.8c.56 0 .84 0 1.054.109a1 1 0 0 1 .437.437C21 9.76 21 10.04 21 10.6v8.8c0 .56 0 .84-.109 1.054a1 1 0 0 1-.437.437C20.24 21 19.96 21 19.4 21h-.8c-.56 0-.84 0-1.054-.109a1 1 0 0 1-.437-.437C17 20.24 17 19.96 17 19.4v-8.8Z"
    />
  </svg>`,
})
export class BarChartSVG {
  constructor() {}
}
