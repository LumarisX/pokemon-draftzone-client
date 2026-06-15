import { Component } from '@angular/core';
import { TooltipService, TooltipData } from './tooltip.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'pdz-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  imports: [CommonModule],
})
export class TooltipComponent {
  tooltip$: Observable<TooltipData | null>;

  constructor(private tooltipService: TooltipService) {
    this.tooltip$ = this.tooltipService.tooltip$;
  }
}
