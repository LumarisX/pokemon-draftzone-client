import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SegmentedOptionComponent } from './segmented-option.component';
import { PDZ_SEGMENTED } from './segmented.token';

export type SegmentedSize = 'sm' | 'md' | 'lg';
export type SegmentedAlign = 'start' | 'stretch';

let nextSegmentedId = 0;

@Component({
  selector: 'pdz-segmented',
  imports: [IconComponent],
  template: `
    <div
      class="pdz-segmented__list"
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledby()"
      (keydown)="onKeydown($event)"
    >
      <span
        #indicator
        class="pdz-segmented__indicator"
        aria-hidden="true"
      ></span>
      @for (option of options(); track option; let i = $index) {
        <button
          #optionButton
          type="button"
          class="pdz-segmented__option"
          role="radio"
          [id]="optionId(i)"
          [attr.aria-checked]="isChecked(i)"
          [attr.tabindex]="i === tabbableIndex() ? 0 : -1"
          [disabled]="disabled() || option.disabled()"
          [class.pdz-segmented__option--checked]="isChecked(i)"
          (click)="select(i)"
        >
          @if (option.icon(); as icon) {
            <pdz-icon aria-hidden="true" [name]="icon" [size]="16" />
          }
          <span class="pdz-segmented__label">{{ option.label() }}</span>
        </button>
      }
    </div>
  `,
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: PDZ_SEGMENTED,
      useExisting: forwardRef(() => SegmentedComponent),
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedComponent),
      multi: true,
    },
  ],
  host: {
    class: 'pdz-segmented',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
  },
})
export class SegmentedComponent implements ControlValueAccessor {
  value = model<unknown>(undefined);
  disabled = model(false, { alias: 'disabled' });
  size = input<SegmentedSize>('md');
  align = input<SegmentedAlign>('start');
  ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  private readonly id = nextSegmentedId++;
  private readonly projected = contentChildren(SegmentedOptionComponent, {
    descendants: true,
  });
  private readonly buttons =
    viewChildren<ElementRef<HTMLButtonElement>>('optionButton');
  private readonly indicator = viewChild<ElementRef<HTMLElement>>('indicator');

  protected readonly options = computed(() =>
    this.projected().filter((option) => option.group === this),
  );

  protected readonly checkedIndex = computed(() =>
    this.options().findIndex((option) => option.value() === this.value()),
  );

  protected readonly tabbableIndex = computed(() => {
    const checked = this.checkedIndex();
    if (checked >= 0) return checked;
    return this.options().findIndex((option) => !option.disabled());
  });

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const host: ElementRef<HTMLElement> = inject(ElementRef);
    const destroyRef = inject(DestroyRef);

    afterRenderEffect(() => {
      this.checkedIndex();
      this.options();
      this.moveIndicator();
    });

    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.moveIndicator());
      observer.observe(host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private moveIndicator() {
    const indicator = this.indicator()?.nativeElement;
    if (!indicator) return;

    const element = this.buttons()[this.checkedIndex()]?.nativeElement;
    if (!element) {
      indicator.style.opacity = '0';
      return;
    }

    indicator.style.opacity = '1';
    indicator.style.transform = `translateX(${element.offsetLeft}px)`;
    indicator.style.width = `${element.offsetWidth}px`;
    indicator.style.height = `${element.offsetHeight}px`;

    indicator.dataset['ready'] = '';
  }

  protected optionId(index: number) {
    return `pdz-segmented-${this.id}-${index}`;
  }

  protected isChecked(index: number) {
    return index === this.checkedIndex();
  }

  protected select(index: number) {
    const option = this.options()[index];
    if (!option || option.disabled() || this.disabled()) return;
    this.value.set(option.value());
    this.onChange(option.value());
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent) {
    const step = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    }[event.key];

    let target: number | undefined;
    if (step !== undefined) {
      target = this.nextEnabled(this.focusedIndex(), step);
    } else if (event.key === 'Home') {
      target = this.nextEnabled(-1, 1);
    } else if (event.key === 'End') {
      target = this.nextEnabled(this.options().length, -1);
    }

    if (target === undefined) return;
    event.preventDefault();
    this.select(target);
    this.buttons()[target]?.nativeElement.focus();
  }

  private focusedIndex() {
    const active = document.activeElement;
    const index = this.buttons().findIndex(
      (button) => button.nativeElement === active,
    );
    return index >= 0 ? index : this.tabbableIndex();
  }

  private nextEnabled(from: number, step: number) {
    const options = this.options();
    if (!options.length) return undefined;
    for (let i = 1; i <= options.length; i++) {
      const index = (from + step * i + options.length * i) % options.length;
      if (!options[index].disabled()) return index;
    }
    return undefined;
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
}
