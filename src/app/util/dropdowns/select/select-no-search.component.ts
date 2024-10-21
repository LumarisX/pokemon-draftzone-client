import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SelectBaseComponent } from './select-base.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CompactSVG } from '../../../images/svg-components/compact.component';

@Component({
  selector: 'select-no-search',
  standalone: true,
  imports: [CommonModule, SelectBaseComponent, CompactSVG, ScrollingModule],
  templateUrl: 'select-no-search.component.html',
})
export class SelectNoSearchComponent<T> extends SelectBaseComponent<T> {}
