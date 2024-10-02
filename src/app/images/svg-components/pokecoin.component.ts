import { Component } from '@angular/core';

@Component({
  selector: 'coin-svg',
  standalone: true,
  imports: [],
  template: `<svg
    class="stroke-symbolColor-main"
    viewBox="0 0 24 24"
    fill="#000"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      style="fill-rule:evenodd"
      d="M6 14.2H5v2h1v1.2H5v2h1V22h2v-2.6h7.6v-2H8v-1.2h7.6v-2H8V13h6a5.5 5.5 0 1 0 0-11H6c-.1 5 0 9.5 0 12.2M8 11h6a3.5 3.5 0 1 0 0-7H8z"
      stroke="#fff"
      stroke-width=".2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg> `,
})
export class CoinSVG {}
