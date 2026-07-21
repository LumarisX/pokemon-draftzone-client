import { OverlayModule } from '@angular/cdk/overlay';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

let nextId = 0;

export type SelectOptionGroup = [
  string,
  { name: string; id: string; desc?: string }[],
];

@Component({
  selector: 'pdz-grouped-select',
  imports: [OverlayModule, IconComponent],
  templateUrl: './grouped-select.component.html',
  styleUrl: './grouped-select.component.scss',
})
export class GroupedSelectComponent {
  readonly selectId = `pdz-grouped-select-${nextId++}`;

  @Input() label = '';
  @Input() groups: SelectOptionGroup[] = [];
  @Input() value: string | undefined;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('triggerEl') triggerEl?: ElementRef<HTMLButtonElement>;

  isOpen = false;
  highlightedId: string | null = null;

  get flatOptions(): { name: string; id: string; desc?: string }[] {
    return this.groups.flatMap((group) => group[1]);
  }

  get selectedOption():
    | { name: string; id: string; desc?: string }
    | undefined {
    return this.flatOptions.find((option) => option.id === this.value);
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (!this.flatOptions.length) return;
    this.highlightedId = this.value ?? this.flatOptions[0]?.id ?? null;
    this.isOpen = true;
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.triggerEl?.nativeElement.focus();
  }

  select(option: { name: string; id: string }): void {
    this.valueChange.emit(option.id);
    this.close();
  }

  handleKeydown(event: KeyboardEvent): void {
    const options = this.flatOptions;
    if (!options.length) return;

    if (!this.isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.open();
      }
      return;
    }

    const index = options.findIndex(
      (option) => option.id === this.highlightedId,
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedId = options[(index + 1) % options.length].id;
        this.scrollToHighlighted();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedId =
          options[(index - 1 + options.length) % options.length].id;
        this.scrollToHighlighted();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (index !== -1) this.select(options[index]);
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
        .querySelector('.grouped-select__option--highlighted')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }
}
