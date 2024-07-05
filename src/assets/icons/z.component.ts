import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'z-svg',
  standalone: true,
  imports: [CommonModule],
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    class="stroke-symbolColor-main"
    version="1.0"
    viewBox="0 0 542 239"
  >
    <path
      d="M136.5 60.9C27.8 107 2.5 118 2.5 119.5s24.9 12.3 133 57.7c73.2 30.7 133.9 56 135 56.3 1.2.3 55-21.9 135.5-55.8 108.7-45.9 133.5-56.7 133.5-58.2S514.5 107 406 60.9C332.6 29.7 272.1 4.1 271.5 4.1c-.5 0-61.3 25.6-135 56.8z"
    />
  </svg>`,
})
export class ZSVG {
  constructor() {}
}
