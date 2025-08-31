import {
  Overlay,
  OverlayModule,
  OverlayOutsideClickDispatcher,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CompactSVG } from '../../../images/svg-components/compact.component';
import { XMarkSVG } from '../../../images/svg-components/xmark.component';
import { SelectBaseComponent } from './select-base.component';

@Component({
  selector: 'select-search',
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    FormsModule,
    CompactSVG,
    ScrollingModule,
    XMarkSVG,
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
export class SelectSearchComponent<T extends { name: string }>
  extends SelectBaseComponent<T>
  implements OnInit
{
  private outsideClickDispatcher = inject(OverlayOutsideClickDispatcher);
  private overlay = inject(Overlay);

  private overlayRef: OverlayRef | null = null;

  query: string = '';
  filteredItems: T[] = [];
  @Input()
  headers: { title: string; key: string; type: 'text' | 'imgPath' }[] = [];

  ngOnInit(): void {
    this.filter();
    // Create an OverlayRef
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
    });

    // Add OverlayRef to the dispatcher
    if (this.overlayRef) {
      this.outsideClickDispatcher.add(this.overlayRef);
    }
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

  override selectItem(item: T | null): void {
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
