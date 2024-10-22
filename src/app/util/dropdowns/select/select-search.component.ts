import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SelectSearchComponent,
      multi: true,
    },
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

  @ViewChild('searchbar') searchbar!: ElementRef<HTMLInputElement>;

  override openDropdown(): void {
    super.openDropdown();
    setTimeout(() => {
      this.searchbar.nativeElement.focus();
    }, 0);
  }
}
