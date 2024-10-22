import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, CdkVirtualScrollViewport],
  template: '',
})
export class SelectBaseComponent<T> implements ControlValueAccessor {
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

  @Output() itemSelected = new EventEmitter<T | null>();

  private _selectedItem: { name: string; value: T; icon?: string } | null =
    null;
  @Input()
  set selectedItem(item: T | { name: string; value: T; icon?: string } | null) {
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
    this.onTouched();
    SelectBaseComponent.openFilter = this;
  }

  closeDropdown() {
    this.isOpen = false;
    SelectBaseComponent.openFilter = null;
  }

  selectItem(item: { name: string; value: T; icon?: string } | null) {
    this.selectedItem = item;
    this.closeDropdown();
    if (item) {
      this.onChange(item.value);
      this.itemSelected.emit(item.value);
    } else {
      this.onChange(null);
      this.itemSelected.emit(null);
    }
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

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: T): void {
    this.selectedItem =
      this.items.find((item) => {
        if (typeof item.value === 'object') {
          return (
            JSON.stringify(item.value).toLowerCase() ===
            JSON.stringify(value).toLowerCase()
          );
        }
        return item.value === value;
      }) || null;
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  clearSelection() {
    this.selectedItem = null;
  }
}
