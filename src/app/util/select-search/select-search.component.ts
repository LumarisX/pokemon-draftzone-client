import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'select-search.component.html',
})
export class SelectSearchComponent implements OnInit {
  @Input() items: { name: string; id?: string }[] = [];
  @Output() selectedItemChange = new EventEmitter<{
    name: string;
    id?: string;
  }>();

  selectedItem: { name: string; id?: string } = { name: '' };
  query: string = '';
  filteredItems: { name: string; id?: string }[] = [];
  isOpen: boolean = false;

  static openFilter: SelectSearchComponent | null = null;

  ngOnInit(): void {
    this.filter();
  }

  openDropdown() {
    if (SelectSearchComponent.openFilter) {
      SelectSearchComponent.openFilter.isOpen = false;
    }
    this.isOpen = true;
    SelectSearchComponent.openFilter = this;
  }

  selectItem(value: { name: string; id?: string }) {
    this.selectedItem = value;
    this.query = '';
    this.isOpen = false;
    this.selectedItemChange.emit(value);
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
