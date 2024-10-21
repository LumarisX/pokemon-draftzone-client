import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompactSVG } from '../../../images/svg-components/compact.component';

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CompactSVG, ScrollingModule],
  templateUrl: 'select-search.component.html',
})
export class SelectSearchComponent<T> implements OnInit {
  private _items: { name: string; value: T }[] = [];
  @Input()
  set items(value: (string | { name: string; value: T })[]) {
    this._items = value.map((item) =>
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      'value' in item
        ? item
        : { name: item, value: item as T }
    );
  }

  get items(): { name: string; value: T }[] {
    return this._items;
  }

  @Input() showSearch: boolean = true;

  @Input() itemSize: number = 28;
  @Input() placeholder: string = 'Select an item';

  @Output() itemSelected = new EventEmitter<T>();

  private _selectedItem: { name: string; value: T } | null = null;
  @Input()
  set selectedItem(item: T | { name: string; value: T }) {
    this._selectedItem =
      item === null
        ? null
        : typeof item === 'object' && 'name' in item && 'value' in item
        ? item
        : { name: String(item), value: item as T };
  }

  get selectedItem(): { name: string; value: T } | null {
    return this._selectedItem;
  }
  query: string = '';
  filteredItems: { name: string; value: T }[] = [];
  isOpen: boolean = false;

  static openFilter: SelectSearchComponent<any> | null = null;

  ngOnInit(): void {
    this.filter();
  }
  toggleDropdown() {
    this.isOpen ? this.closeDropdown() : this.openDropdown();
  }

  openDropdown() {
    SelectSearchComponent.openFilter?.closeDropdown();
    this.isOpen = true;
    SelectSearchComponent.openFilter = this;
  }

  closeDropdown() {
    SelectSearchComponent.openFilter = null;
    this.isOpen = false;
  }

  selectItem(item: { name: string; value: T }) {
    this.selectedItem = item;
    this.query = '';
    this.closeDropdown();
    this.itemSelected.emit(item.value);
  }

  filter() {
    this.filteredItems = this.items.filter((i) =>
      i.name.toLowerCase().includes(this.query.toLowerCase())
    );
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.filter-container')) {
      this.isOpen = false;
    }
  }

  calculateDynamicHeight(itemCount: number, itemSize: number): string {
    return `${Math.min(itemCount * itemSize, 256)}px`;
  }
}
