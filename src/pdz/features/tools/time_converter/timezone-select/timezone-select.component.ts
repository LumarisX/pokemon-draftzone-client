import { OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export type TimeZone = {
  short?: string;
  name: string;
  utc: string;
  offset: number;
};

let nextId = 0;

@Component({
  selector: 'pdz-timezone-select',
  imports: [OverlayModule, FormsModule, IconComponent],
  templateUrl: './timezone-select.component.html',
  styleUrl: './timezone-select.component.scss',
})
export class TimezoneSelectComponent {
  readonly selectId = `pdz-timezone-select-${nextId++}`;

  readonly label = input('');
  readonly value = input<TimeZone>();
  @Output() valueChange = new EventEmitter<TimeZone>();

  @Input() set zones(value: TimeZone[]) {
    this._zones = value;
    this.applyFilter();
  }
  @Input() set shortZones(value: TimeZone[]) {
    this._shortZones = value;
    this.applyFilter();
  }

  @ViewChild('triggerEl') triggerEl?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchEl') searchEl?: ElementRef<HTMLInputElement>;

  private _zones: TimeZone[] = [];
  private _shortZones: TimeZone[] = [];

  isOpen = false;
  search = '';
  filteredZones: TimeZone[] = [];
  filteredShort: TimeZone[] = [];
  highlighted: TimeZone | null = null;

  get triggerLabel(): string {
    const value = this.value();
    if (!value) return 'Select a time zone...';
    return value.short ? `${value.short} (${value.utc})` : value.utc;
  }

  get options(): TimeZone[] {
    return [...this.filteredShort, ...this.filteredZones];
  }

  applyFilter(): void {
    const query = this.search.trim().toLowerCase();
    if (!query) {
      this.filteredZones = [...this._zones];
      this.filteredShort = [...this._shortZones];
    } else {
      this.filteredZones = this._zones.filter(
        (tz) =>
          tz.name
            .toLowerCase()
            .split(/\W+/)
            .some((word) => word.startsWith(query)) ||
          tz.short?.toLowerCase().includes(query),
      );
      this.filteredShort = this._shortZones.filter((tz) =>
        tz.short?.toLowerCase().includes(query),
      );
    }
    this.highlighted = this.options[0] ?? null;
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    this.search = '';
    this.applyFilter();
    this.highlighted = this.value() ?? this.options[0] ?? null;
    this.isOpen = true;
    setTimeout(() => this.searchEl?.nativeElement.focus());
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.triggerEl?.nativeElement.focus();
  }

  select(zone: TimeZone): void {
    this.value = zone;
    this.valueChange.emit(zone);
    this.close();
  }

  isSelected(zone: TimeZone): boolean {
    const value = this.value();
    return value?.name === zone.name && value?.short === zone.short;
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      this.open();
    }
  }

  handleSearchKeydown(event: KeyboardEvent): void {
    const options = this.options;
    const index = options.findIndex((tz) => tz === this.highlighted);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (options.length) {
          this.highlighted = options[(index + 1) % options.length];
          this.scrollToHighlighted();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (options.length) {
          this.highlighted =
            options[(index - 1 + options.length) % options.length];
          this.scrollToHighlighted();
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.highlighted) this.select(this.highlighted);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private scrollToHighlighted(): void {
    setTimeout(() => {
      document
        .querySelector('.timezone-select__option--highlighted')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }
}
