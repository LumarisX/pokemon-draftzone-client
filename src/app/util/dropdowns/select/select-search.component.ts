import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CompactSVG } from '../../../images/svg-components/compact.component';
import { XMarkSVG } from '../../../images/svg-components/xmark.component';
import { SelectBaseComponent } from './select-base.component';

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CompactSVG, ScrollingModule, XMarkSVG],
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
  @Input()
  headers: { name: string; value: string; type: 'text' | 'imgPath' }[] = [];

  ngOnInit(): void {
    this.filter();
  }

  filter() {
    const queryLower = this.query.toLowerCase();
    this.filteredItems = this.items
      .filter((i) => i.name.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(queryLower);
        const bStartsWith = b.name.toLowerCase().startsWith(queryLower);
        return aStartsWith === bStartsWith ? 0 : aStartsWith ? -1 : 1;
      });
  }

  @ViewChild('searchbar') searchbar!: ElementRef<HTMLInputElement>;

  override openDropdown(): void {
    super.openDropdown();
    setTimeout(() => {
      this.searchbar.nativeElement.focus();
    }, 0);
  }

  override selectItem(
    item: { name: string; value: T; icons?: string[] } | null,
  ): void {
    super.selectItem(item);
    this.clearQuery();
  }

  keypress(key: string) {
    if (key === 'Enter') {
      this.selectFirst();
    } else {
      this.filter();
    }
  }

  selectFirst() {
    this.selectItem(this.filteredItems[0]);
  }

  clearQuery() {
    this.query = '';
    this.filteredItems = this.items;
  }

  override clearSelection(): void {
    super.clearSelection();
    this.selectItem(null);
    this.clearQuery();
    this.closeDropdown();
  }
}
