import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TooltipData {
  content: string;
  left: number;
  top: number;
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  private tooltipSubject = new BehaviorSubject<TooltipData | null>(null);
  tooltip$ = this.tooltipSubject.asObservable();

  show(content: string, left: number, top: number) {
    this.tooltipSubject.next({ content, left, top });
  }

  hide() {
    this.tooltipSubject.next(null);
  }
}
