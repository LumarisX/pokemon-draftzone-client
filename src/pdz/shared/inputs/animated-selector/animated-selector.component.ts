import { CommonModule } from '@angular/common';
import {
  Component,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export interface AnimatedSelectorOption<T> {
  value: T;
  label: string;
  icon?: string;
}

@Component({
  selector: 'pdz-animated-selector',
  templateUrl: './animated-selector.component.html',
  styleUrls: ['./animated-selector.component.scss'],
  imports: [CommonModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AnimatedSelectorComponent),
      multi: true,
    },
  ],
})
export class AnimatedSelectorComponent<T = string>
  implements OnChanges, AfterViewInit, ControlValueAccessor
{
  readonly options = input.required<(T | AnimatedSelectorOption<T>)[]>();
  readonly selected = model<T | null>(null);
  readonly label = input<string>();
  readonly direction = input<'vertical' | 'horizontal'>('vertical');

  @ViewChild('selector', { static: false }) selectorRef?: ElementRef;
  @ViewChild('highlightBar', { static: false }) highlightBarRef?: ElementRef;

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    this.updateHighlightPosition();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selected'] && !changes['selected'].firstChange) {
      setTimeout(() => this.updateHighlightPosition(), 0);
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: T | null): void {
    this.selected.set(value);
    setTimeout(() => this.updateHighlightPosition(), 0);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Can implement disable state if needed
  }

  selectOption(option: T | AnimatedSelectorOption<T>) {
    const value = this.isOptionObject(option) ? option.value : option;
    if (value === this.selected()) return;
    this.selected.set(value);
    this.onChange(value);
    this.onTouched();
    setTimeout(() => this.updateHighlightPosition(), 0);
  }

  getOptionValue(option: T | AnimatedSelectorOption<T>): T {
    return this.isOptionObject(option) ? option.value : option;
  }

  getOptionLabel(option: T | AnimatedSelectorOption<T>): string {
    if (this.isOptionObject(option)) {
      return option.label;
    }
    return String(option);
  }

  getOptionIcon(option: T | AnimatedSelectorOption<T>): string | undefined {
    return this.isOptionObject(option) ? option.icon : undefined;
  }

  private isOptionObject(
    option: T | AnimatedSelectorOption<T>,
  ): option is AnimatedSelectorOption<T> {
    return (
      typeof option === 'object' &&
      option !== null &&
      'value' in option &&
      'label' in option
    );
  }

  private updateHighlightPosition() {
    if (!this.selectorRef || !this.highlightBarRef) return;

    const selectedIndex = this.options().findIndex(
      (o) => this.getOptionValue(o) === this.selected(),
    );
    if (selectedIndex === -1) return;

    const selectorEl = this.selectorRef.nativeElement as HTMLElement;
    const highlightEl = this.highlightBarRef.nativeElement as HTMLElement;
    const buttons = Array.from(
      selectorEl.querySelectorAll('.selector-option'),
    ) as HTMLElement[];

    if (buttons[selectedIndex]) {
      const button = buttons[selectedIndex];

      if (this.direction() === 'horizontal') {
        const offset = button.offsetLeft;
        const width = button.offsetWidth;
        highlightEl.style.transform = `translateX(${offset}px)`;
        highlightEl.style.width = `${width}px`;
        highlightEl.style.height = '';
      } else {
        const offset = button.offsetTop;
        const height = button.offsetHeight;
        highlightEl.style.transform = `translateY(${offset}px)`;
        highlightEl.style.height = `${height}px`;
        highlightEl.style.width = '';
      }
    }
  }

  trackByOption(index: number, option: T | AnimatedSelectorOption<T>): T {
    return this.getOptionValue(option);
  }
}
