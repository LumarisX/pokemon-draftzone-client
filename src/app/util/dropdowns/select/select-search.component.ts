import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompactSVG } from '../../../images/svg-components/compact.component';
import { SelectBaseComponent } from './select-base.component';

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CompactSVG,
    SelectBaseComponent,
    ScrollingModule,
  ],
  templateUrl: 'select-search.component.html',
})
export class SelectSearchComponent<T>
  extends SelectBaseComponent<T>
  implements OnInit
{
  query: string = '';
  filteredItems: { name: string; value: T }[] = [];

  ngOnInit(): void {
    this.filter();
  }

  filter() {
    this.filteredItems = this.items.filter((i) =>
      i.name.toLowerCase().includes(this.query.toLowerCase())
    );
  }
}
