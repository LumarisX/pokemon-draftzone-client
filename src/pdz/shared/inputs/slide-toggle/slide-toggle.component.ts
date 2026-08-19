import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Output,
  Renderer2,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

@Component({
  selector: 'pdz-slide-toggle',
  imports: [IconComponent],
  templateUrl: './slide-toggle.component.html',
  styleUrls: ['./slide-toggle.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SlideToggleComponent),
      multi: true,
    },
  ],
})
export class SlideToggleComponent implements ControlValueAccessor {
  private renderer = inject(Renderer2);
  private elRef = inject(ElementRef);

  disabled = input(false);
  readonly label = input<string>();
  readonly onIcon = input('check');
  readonly offIcon = input('remove');
  readonly onSVG = input<string>();
  readonly offSVG = input<string>();
  readonly labelPosition = input<'before' | 'after'>('after');
  @HostBinding('class.checked') checkedState = false;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() checked = new EventEmitter<void>();
  @Output() unchecked = new EventEmitter<void>();

  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  writeValue(value: boolean): void {
    this.checkedState = value;
    this.renderer.setAttribute(
      this.elRef.nativeElement,
      'aria-checked',
      String(value),
    );
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.apply(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    this.checkedState = !this.checkedState;
    this.onChange(this.checkedState);
    this.onTouched();
    this.checkedChange.emit(this.checkedState);
    if (this.checkedState) {
      this.checked.emit();
    } else {
      this.unchecked.emit();
    }
  }

  @HostListener('keydown.space', ['$event'])
  handleKeydown(event: Event): void {
    event.preventDefault();
    this.toggle();
  }
}
