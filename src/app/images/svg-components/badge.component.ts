import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'badge-svg',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(selected){
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="stroke-symbolColor-sub"
      [style.width.em]="iconSize"
      [style.height.em]="iconSize"
    >
      <path
        d="m8.5 12.5 1.509 1.509c.344.344.515.515.71.573a.8.8 0 0 0 .522-.024c.19-.075.345-.261.656-.635L16 9m.329-4.241a3 3 0 0 1 2.035.877 3 3 0 0 1 .877 2.035c.021.731.032 1.097.053 1.182.046.182-.007.053.089.215.045.075.296.34.798.872A3 3 0 0 1 21 12a3 3 0 0 1-.819 2.06c-.502.531-.753.797-.798.872-.096.162-.043.033-.089.215-.021.085-.032.45-.053 1.182a3 3 0 0 1-.877 2.035 3 3 0 0 1-2.035.877c-.731.021-1.097.032-1.182.053-.182.046-.053-.007-.215.09-.075.044-.34.295-.873.797A3 3 0 0 1 12 21a3 3 0 0 1-2.06-.819c-.531-.502-.797-.753-.872-.798-.162-.096-.033-.043-.215-.089-.085-.021-.45-.032-1.182-.053a3 3 0 0 1-2.035-.877 3 3 0 0 1-.877-2.035c-.021-.731-.032-1.097-.053-1.182-.046-.182.007-.053-.09-.215-.044-.075-.295-.34-.797-.873A3 3 0 0 1 3 12c0-.797.311-1.522.819-2.06.502-.531.753-.797.798-.872.096-.162.043-.033.089-.215.021-.085.032-.45.053-1.182a3 3 0 0 1 .877-2.035 3 3 0 0 1 2.035-.877c.731-.021 1.097-.032 1.182-.053.182-.046.053.007.215-.09.075-.044.34-.295.872-.797A3 3 0 0 1 12 3a3 3 0 0 1 2.06.819c.531.502.797.753.872.798.162.096.033.043.215.089.085.021.45.032 1.182.053"
        stroke="#000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    } @else {
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="stroke-symbolColor-sub"
      [style.width.em]="iconSize"
      [style.height.em]="iconSize"
    >
      <path
        d="M18.364 5.636a3 3 0 0 0-2.035-.877c-.731-.021-1.097-.032-1.182-.053-.182-.046-.053.007-.215-.09-.075-.044-.34-.295-.873-.797A3 3 0 0 0 12 3a3 3 0 0 0-2.06.819c-.531.502-.797.753-.872.798-.162.096-.033.043-.215.089-.085.021-.45.032-1.182.053a3 3 0 0 0-2.035.877 3 3 0 0 0-.877 2.035c-.021.731-.032 1.097-.053 1.182-.046.182.007.053-.09.215-.044.075-.295.34-.797.872A3 3 0 0 0 3 12c0 .797.311 1.522.819 2.06.502.531.753.797.798.872.096.162.043.033.089.215.021.085.032.45.053 1.182a3 3 0 0 0 .877 2.035 3 3 0 0 0 2.035.877c.731.021 1.097.032 1.182.053.182.046.053-.007.215.09.075.044.34.295.872.797A3 3 0 0 0 12 21a3 3 0 0 0 2.06-.819c.531-.502.797-.753.872-.798.162-.096.033-.043.215-.089.085-.021.45-.032 1.182-.053a3 3 0 0 0 2.035-.877 3 3 0 0 0 .877-2.035c.021-.731.032-1.097.053-1.182.046-.182-.007-.053.089-.215.045-.075.296-.34.798-.873A3 3 0 0 0 21 12a3 3 0 0 0-.819-2.06c-.502-.531-.753-.797-.798-.872-.096-.162-.043-.033-.089-.215-.021-.085-.032-.45-.053-1.182a3 3 0 0 0-.877-2.035"
        stroke="#000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    }
  `,
})
export class BadgeSVG {
  @Input()
  selected: boolean = true;
  @Input()
  iconSize?: number;
}
