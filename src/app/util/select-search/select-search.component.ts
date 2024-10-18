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
import { CompactSVG } from '../../images/svg-components/compact.component';

type Item = { name: string; id?: string };

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CompactSVG, ScrollingModule],
  templateUrl: 'select-search.component.html',
})
export class SelectSearchComponent implements OnInit {
  private _items: Item[] = [];
  @Input()
  set items(value: (string | Item)[]) {
    this._items = value.map((item) =>
      typeof item === 'string' ? { name: item } : item
    );
  }
  get items(): Item[] {
    return this._items;
  }

  itemSize: number = 28;
  @Input() placeholder: string = 'Select an item';

  @Output() itemSelected = new EventEmitter<string>();

  private _selectedItem = { name: '' };
  @Input()
  set selectedItem(value: string | Item) {
    this._selectedItem = typeof value === 'string' ? { name: value } : value;
  }
  get selectedItem(): Item {
    return this._selectedItem;
  }
  query: string = '';
  filteredItems: Item[] = [];
  isOpen: boolean = false;

  static openFilter: SelectSearchComponent | null = null;

  ngOnInit(): void {
    this.filter();
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    if (SelectSearchComponent.openFilter) {
      SelectSearchComponent.openFilter.closeDropdown();
    }
    this.isOpen = true;
    SelectSearchComponent.openFilter = this;
  }

  closeDropdown() {
    if (SelectSearchComponent.openFilter === this) {
      SelectSearchComponent.openFilter = null;
    }
    this.isOpen = false;
  }

  selectItem(value: { name: string; id?: string }) {
    this.selectedItem = value;
    this.query = '';
    this.closeDropdown();
    this.itemSelected.emit(value.id ?? value.name);
  }

  filter() {
    this.filteredItems = this.items.filter((i) =>
      i.name.toLowerCase().includes(this.query.toLowerCase())
    );
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    if (!targetElement.closest('.filter-container')) {
      this.isOpen = false;
    }
  }
}
