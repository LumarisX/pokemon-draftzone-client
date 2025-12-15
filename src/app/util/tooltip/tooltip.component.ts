import { Component } from '@angular/core';
import { TooltipService, TooltipData } from './tooltip.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'pdz-tooltip',
  standalone: false,
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
})
export class TooltipComponent {
  tooltip$: Observable<TooltipData | null>;

  constructor(private tooltipService: TooltipService) {
    this.tooltip$ = this.tooltipService.tooltip$;
  }
}
