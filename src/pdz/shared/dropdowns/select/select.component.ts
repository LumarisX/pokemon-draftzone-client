import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SelectOptionComponent } from './select-option.component';
import { PDZ_SELECT } from './select.token';

let nextSelectId = 0;

const TYPEAHEAD_RESET = 700;
const MIN_LISTBOX_SPACE = 240;
const VIEWPORT_MARGIN = 8;

@Component({
  selector: 'pdz-select',
  imports: [IconComponent],
  template: `
    <button
      #trigger
      type="button"
      class="pdz-select__trigger"
      role="combobox"
      [id]="triggerId"
      [disabled]="disabled()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="listboxId"
      [attr.aria-activedescendant]="isOpen() ? activeId() : null"
      [attr.aria-labelledby]="ariaLabelledby()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-invalid]="invalid() ? true : null"
      [class.pdz-select__trigger--placeholder]="!selected()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >
      <span class="pdz-select__value">{{
        triggerLabel() ?? placeholder()
      }}</span>
      <pdz-icon
        class="pdz-select__arrow"
        aria-hidden="true"
        name="expand_more"
        [size]="18"
      />
    </button>

    <div
      #listbox
      popover="manual"
      class="pdz-select__listbox"
      role="listbox"
      [id]="listboxId"
      [attr.aria-labelledby]="ariaLabelledby() ?? triggerId"
    >
      @for (entry of entries(); track entry.option; let i = $index) {
        @if (entry.groupStart) {
          <p class="pdz-select__group" role="presentation">
            {{ entry.option.group() }}
          </p>
        }
        <div
          class="pdz-select__option"
          role="option"
          [id]="optionId(i)"
          [attr.aria-selected]="entry.option.value() === value()"
          [attr.aria-disabled]="entry.option.disabled() ? true : null"
          [class.pdz-select__option--active]="i === activeIndex()"
          [class.pdz-select__option--selected]="
            entry.option.value() === value()
          "
          [class.pdz-select__option--disabled]="entry.option.disabled()"
          (click)="pick(i)"
          (mouseenter)="activeIndex.set(i)"
        >
          <span class="pdz-select__option-text">
            <span class="pdz-select__option-label">{{
              entry.option.label()
            }}</span>
            @if (entry.option.description(); as description) {
              <span class="pdz-select__option-description">{{
                description
              }}</span>
            }
          </span>
          @if (entry.option.value() === value()) {
            <pdz-icon aria-hidden="true" name="check" [size]="16" />
          }
        </div>
      }
      @if (!entries().length) {
        <p class="pdz-select__empty">No options</p>
      }
    </div>
  `,
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: PDZ_SELECT, useExisting: forwardRef(() => SelectComponent) },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    class: 'pdz-select',
    '[attr.data-size]': 'size()',
    '[class.pdz-select--open]': 'isOpen()',
    '[class.pdz-select--disabled]': 'disabled()',
    '[class.pdz-select--invalid]': 'invalid()',
  },
})
export class SelectComponent implements ControlValueAccessor {
  value = model<unknown>(undefined);
  size = input<'sm' | 'md'>('md');
  placeholder = input('Select…');
  disabled = model(false);
  invalid = input(false, { transform: booleanAttribute });
  ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  private readonly id = nextSelectId++;
  protected readonly triggerId = `pdz-select-trigger-${this.id}`;
  protected readonly listboxId = `pdz-select-listbox-${this.id}`;

  private readonly projected = contentChildren(SelectOptionComponent, {
    descendants: true,
  });
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly listbox =
    viewChild.required<ElementRef<HTMLElement>>('listbox');

  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly options = computed(() =>
    this.projected().filter((option) => option.owner === this),
  );

  protected readonly entries = computed(() => {
    let previousGroup: string | undefined;
    return this.options().map((option) => {
      const group = option.group();
      const groupStart = !!group && group !== previousGroup;
      previousGroup = group;
      return { option, groupStart };
    });
  });

  protected readonly selected = computed(() =>
    this.options().find((option) => option.value() === this.value()),
  );

  protected readonly triggerLabel = computed(() => {
    const option = this.selected();
    if (!option) return null;
    const group = option.group();
    return group ? `${group} · ${option.label()}` : option.label();
  });

  protected readonly activeId = computed(() =>
    this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null,
  );

  private readonly document = inject(DOCUMENT);
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;
  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const onPointerDown = (event: Event) => {
      if (!this.isOpen()) return;
      const target = event.target as Node;
      if (
        this.trigger().nativeElement.contains(target) ||
        this.listbox().nativeElement.contains(target)
      ) {
        return;
      }
      this.close();
    };
    const reposition = () => {
      if (this.isOpen()) this.position();
    };

    this.document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      clearTimeout(this.typeaheadTimer);
    });
  }

  writeValue(value: unknown) {
    this.value.set(value);
  }

  registerOnChange(fn: (value: unknown) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  protected optionId(index: number) {
    return `pdz-select-option-${this.id}-${index}`;
  }

  protected toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.openList();
    }
  }

  protected openList() {
    if (this.disabled() || this.isOpen()) return;
    this.isOpen.set(true);
    this.listbox().nativeElement.showPopover();
    this.position();

    const selected = this.selected();
    const selectedIndex = selected ? this.options().indexOf(selected) : -1;
    this.activeIndex.set(
      selectedIndex >= 0 ? selectedIndex : (this.step(-1, 1) ?? -1),
    );
    this.scrollActiveIntoView();
  }

  protected close() {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    this.listbox().nativeElement.hidePopover();
    this.onTouched();
  }

  protected pick(index: number) {
    const option = this.options()[index];
    if (!option || option.disabled()) return;
    this.value.set(option.value());
    this.onChange(option.value());
    this.close();
    this.trigger().nativeElement.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent) {
    const key = event.key;

    if (!this.isOpen()) {
      if (
        key === 'ArrowDown' ||
        key === 'ArrowUp' ||
        key === 'Enter' ||
        key === ' '
      ) {
        event.preventDefault();
        this.openList();
      }
      return;
    }

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        return;
      case 'Tab':
        this.close();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.pick(this.activeIndex());
        return;
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const next = this.step(
          this.activeIndex(),
          key === 'ArrowDown' ? 1 : -1,
        );
        if (next !== undefined) this.activeIndex.set(next);
        this.scrollActiveIntoView();
        return;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        const next =
          key === 'Home'
            ? this.step(-1, 1)
            : this.step(this.options().length, -1);
        if (next !== undefined) this.activeIndex.set(next);
        this.scrollActiveIntoView();
        return;
      }
    }

    if (key.length === 1 && !event.metaKey && !event.ctrlKey) {
      this.search(key);
    }
  }

  private search(key: string) {
    clearTimeout(this.typeaheadTimer);
    this.typeahead += key.toLowerCase();
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = '';
    }, TYPEAHEAD_RESET);

    const match = this.options().findIndex(
      (option) =>
        !option.disabled() &&
        option.label().toLowerCase().startsWith(this.typeahead),
    );
    if (match >= 0) {
      this.activeIndex.set(match);
      this.scrollActiveIntoView();
    }
  }

  private step(from: number, direction: number) {
    const options = this.options();
    if (!options.length) return undefined;
    for (let i = 1; i <= options.length; i++) {
      const index =
        (from + direction * i + options.length * i) % options.length;
      if (!options[index].disabled()) return index;
    }
    return undefined;
  }

  private scrollActiveIntoView() {
    queueMicrotask(() => {
      this.listbox()
        .nativeElement.querySelector('.pdz-select__option--active')
        ?.scrollIntoView({ block: 'nearest' });
    });
  }

  private position() {
    const trigger = this.trigger().nativeElement.getBoundingClientRect();
    const listbox = this.listbox().nativeElement;
    const below = window.innerHeight - trigger.bottom;
    const flip = below < MIN_LISTBOX_SPACE && trigger.top > below;

    listbox.style.minWidth = `${trigger.width}px`;
    listbox.style.left = '0';
    listbox.style.maxWidth = `${window.innerWidth - VIEWPORT_MARGIN * 2}px`;
    listbox.style.maxHeight = `${Math.max(120, (flip ? trigger.top : below) - 16)}px`;

    const width = listbox.getBoundingClientRect().width;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    listbox.style.left = `${Math.max(VIEWPORT_MARGIN, Math.min(trigger.left, maxLeft))}px`;

    if (flip) {
      listbox.style.top = 'auto';
      listbox.style.bottom = `${window.innerHeight - trigger.top + 4}px`;
    } else {
      listbox.style.bottom = 'auto';
      listbox.style.top = `${trigger.bottom + 4}px`;
    }
  }
}
