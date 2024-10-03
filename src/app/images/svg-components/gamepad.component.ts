import { Component } from '@angular/core';

@Component({
  selector: 'gamepad-svg',
  standalone: true,
  imports: [],
  template: `<svg
    class="w-full h-full stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 11h4M8 9v4m7-1h.01M18 10h.01m-7.56-5h3.101c2.625 0 3.937 0 4.968.497a5 5 0 0 1 2.162 2.014c.57.992.663 2.3.85 4.919l.246 3.444a2.918 2.918 0 0 1-5.152 2.076l-.375-.45c-.343-.412-.515-.618-.71-.784a3 3 0 0 0-1.435-.672C13.852 16 13.583 16 13.048 16h-2.095c-.536 0-.804 0-1.057.044a3 3 0 0 0-1.436.672c-.195.166-.367.372-.71.784l-.375.45a2.918 2.918 0 0 1-5.152-2.075l.246-3.445c.187-2.618.28-3.927.85-4.92a5 5 0 0 1 2.163-2.013C6.512 5 7.824 5 10.449 5"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>`,
})
export class GamepadSVG {
  constructor() {}
}
