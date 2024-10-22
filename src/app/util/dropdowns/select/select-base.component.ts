import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'select-base',
  standalone: true,
  imports: [CommonModule, CdkVirtualScrollViewport],
  template: '',
})
export class SelectBaseComponent<T> {
  private _items: { name: string; value: T; icon?: string }[] = [];

  @Input()
  set items(value: (string | { name: string; value: T; icon?: string })[]) {
    this._items = value.map((item) =>
      typeof item === 'object' && 'name' in item
        ? item
        : { name: String(item), value: item as T }
    );
  }

  get items(): { name: string; value: T; icon?: string }[] {
    return this._items;
  }

  @Input() itemSize: number = 28;
  @Input() placeholder: string = 'Select an item';

  @Output() itemSelected = new EventEmitter<T>();

  private _selectedItem: { name: string; value: T; icon?: string } | null =
    null;
  @Input()
  set selectedItem(item: T | { name: string; value: T; icon?: string }) {
    console.log(this.selectedItem, item);
    this._selectedItem =
      item === null
        ? null
        : typeof item === 'object' && 'name' in item && 'value' in item
        ? item
        : { name: String(item), value: item as T };
  }

  get selectedItem(): { name: string; value: T; icon?: string } | null {
    return this._selectedItem;
  }

  isOpen: boolean = false;

  static openFilter: SelectBaseComponent<any> | null = null;

  toggleDropdown() {
    this.isOpen ? this.closeDropdown() : this.openDropdown();
  }

  openDropdown() {
    SelectBaseComponent.openFilter?.closeDropdown();
    this.isOpen = true;
    SelectBaseComponent.openFilter = this;
  }

  closeDropdown() {
    this.isOpen = false;
    SelectBaseComponent.openFilter = null;
  }

  selectItem(item: { name: string; value: T; icon?: string }) {
    this.selectedItem = item;
    this.closeDropdown();
    this.itemSelected.emit(item.value);
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
