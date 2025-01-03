import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: '',
})
export class SelectBaseComponent<T extends { name: string }>
  implements ControlValueAccessor
{
  private _items: T[] = [];

  @Input()
  set items(value: (string | T)[]) {
    this._items = value.map((item) =>
      typeof item === 'string' ? ({ name: String(item) } as T) : item,
    );
  }

  get items(): T[] {
    return this._items;
  }

  @Input() itemSize: number = 28;
  @Input() placeholder: string = 'Select an item';
  @Input() class: string = '';
  @Output() itemSelected = new EventEmitter<T | null>();

  private _selectedItem: T | null = null;
  @Input()
  set startItem(item: string | T | null) {
    if (item) {
      this._selectedItem =
        this.items.find((e) => {
          if (typeof item === 'string') return e.name === item;
          else return e.name === item.name;
        }) ?? null;
    }
  }

  set selectedItem(item: T | null) {
    this._selectedItem = item;
  }

  get selectedItem(): T | null {
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

  selectItem(item: T | null) {
    this.selectedItem = item;
    this.closeDropdown();
    if (item) {
      this.onChange(item);
      this.itemSelected.emit(item);
    } else {
      this.onChange(null);
      this.itemSelected.emit(null);
    }
  }

  // @HostListener('document:click', ['$event'])
  // clickOutside(event: MouseEvent) {
  //   if (!(event.target as HTMLElement).closest('.filter-container')) {
  //     this.isOpen = false;
  //   }
  // }

  calculateDynamicHeight(itemCount: number, itemSize: number): string {
    return `${Math.min(itemCount * itemSize, 256)}px`;
  }

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: T): void {
    this.selectedItem =
      this.items.find((item) => {
        return item.name === value.name;
      }) ?? value;
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
