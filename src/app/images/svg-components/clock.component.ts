import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'clock-svg',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      *ngIf="!animated"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full stroke-symbolColor-main"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 7v5l2.5 1.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
    <svg
      *ngIf="animated"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      class="w-full h-full stroke-symbolColor-main"
      viewBox="0 0 24 24"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    >
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path d="M12 7v5">
        <animateTransform
          additive="sum"
          attributeName="transform"
          attributeType="xml"
          dur="9s"
          from="0 12 12"
          repeatCount="indefinite"
          to="360 12 12"
          type="rotate"
        />
      </path>
      <path d="M12 9v3">
        <animateTransform
          additive="sum"
          attributeName="transform"
          attributeType="xml"
          dur="17s"
          from="0 12 12"
          repeatCount="indefinite"
          to="360 12 12"
          type="rotate"
        />
      </path>
    </svg>
  `,
})
export class ClockSVG {
  animated = false;
  constructor() {}
}
