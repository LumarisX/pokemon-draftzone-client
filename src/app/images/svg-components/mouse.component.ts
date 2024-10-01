import { Component } from '@angular/core';

@Component({
  selector: 'mouse-svg',
  standalone: true,
  imports: [],
  template: ` <svg
    class="w-full h-full stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 7v2m5.332 7.011.48-7.197.013-.208a5 5 0 0 0-1.916-4.173l-.165-.125-.269-.199a6 6 0 0 0-6.95 0c-.064.045-.132.096-.27.199l-.165.125a5 5 0 0 0-1.903 4.38l.48 7.198a5.344 5.344 0 0 0 10.665 0Z"
      stroke="#000"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>`,
})
export class MouseSVG {
  constructor() {}
}
