import { Component } from '@angular/core';

@Component({
  selector: 'wifi-svg',
  standalone: true,
  imports: [],
  template: ` <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full stroke-symbolColor-main"
  >
    <path
      d="M1.333 8.074a1 1 0 1 0 1.334 1.49zm20 1.49a1 1 0 1 0 1.334-1.49zM12 19a1 1 0 1 0 0 2zm.01 2a1 1 0 1 0 0-2zm2.68-3.96a1 1 0 0 0 1.346-1.48zm3.364-3.7a1 1 0 0 0 1.346-1.48zm-10.09 2.22a1 1 0 0 0 1.345 1.48zM4.6 11.86a1 1 0 1 0 1.346 1.48zM2.667 9.566A13.94 13.94 0 0 1 12 6V4A15.94 15.94 0 0 0 1.333 8.074zM12 6c3.586 0 6.856 1.347 9.333 3.565l1.334-1.49A15.94 15.94 0 0 0 12 4zm0 15h.01v-2H12zm0-5c1.037 0 1.98.393 2.69 1.04l1.346-1.48A5.98 5.98 0 0 0 12 14zm0-5c2.332 0 4.455.886 6.054 2.34l1.346-1.48A10.96 10.96 0 0 0 12 9zm-2.69 6.04A3.98 3.98 0 0 1 12 16v-2a5.98 5.98 0 0 0-4.036 1.56zm-3.364-3.7A8.96 8.96 0 0 1 12 11V9a10.96 10.96 0 0 0-7.4 2.86z"
      fill="#000"
    />
  </svg>`,
})
export class WifiSVG {
  constructor() {}
}
