import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SelectBaseComponent } from './select-base.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CompactSVG } from '../../../images/svg-components/compact.component';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'select-no-search',
  standalone: true,
  imports: [CommonModule, CompactSVG, ScrollingModule],
  templateUrl: 'select-no-search.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectNoSearchComponent,
      multi: true,
    },
  ],
})
export class SelectNoSearchComponent<
  T extends { name: string },
> extends SelectBaseComponent<T> {}
