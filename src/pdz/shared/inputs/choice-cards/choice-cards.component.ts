import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChoiceCardComponent } from './choice-card.component';
import { PDZ_CHOICE_CARDS } from './choice-cards.token';

let nextChoiceCardsId = 0;

@Component({
  selector: 'pdz-choice-cards',
  imports: [CardComponent, IconComponent],
  template: `
    <div
      class="pdz-choice-cards__list"
      role="radiogroup"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-labelledby]="ariaLabelledby()"
      [attr.aria-disabled]="disabled() || null"
      (keydown)="onKeydown($event)"
    >
      @for (option of options(); track option; let i = $index) {
        <button
          #optionButton
          pdz-card
          padding="md"
          role="radio"
          class="pdz-choice-card"
          [selected]="isChecked(i)"
          [attr.aria-checked]="isChecked(i)"
          [attr.aria-describedby]="option.description() ? descriptionId(i) : null"
          [attr.tabindex]="i === tabbableIndex() ? 0 : -1"
          [disabled]="disabled() || option.disabled()"
          (click)="select(i)"
        >
          <span class="pdz-choice-card__inner">
            <span class="pdz-choice-card__head">
              @if (option.icon(); as icon) {
                <pdz-icon
                  class="pdz-choice-card__icon"
                  aria-hidden="true"
                  [name]="icon"
                  [size]="24"
                />
              }
              <span class="pdz-choice-card__label">{{ option.label() }}</span>
              @if (isChecked(i)) {
                <pdz-icon
                  class="pdz-choice-card__mark"
                  aria-hidden="true"
                  name="check_circle"
                  [size]="20"
                />
              }
            </span>
            @if (option.description(); as description) {
              <span class="pdz-choice-card__description" [id]="descriptionId(i)">
                {{ description }}
              </span>
            }
            @if (option.note(); as note) {
              <span class="pdz-choice-card__note">{{ note }}</span>
            }
          </span>
        </button>
      }
    </div>
  `,
  styleUrl: './choice-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: PDZ_CHOICE_CARDS,
      useExisting: forwardRef(() => ChoiceCardsComponent),
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChoiceCardsComponent),
      multi: true,
    },
  ],
  host: { class: 'pdz-choice-cards' },
})
export class ChoiceCardsComponent<T = unknown> implements ControlValueAccessor {
  value = model<T | null>(null);
  disabled = model(false);
  ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  ariaLabelledby = input<string | undefined>(undefined, {
    alias: 'aria-labelledby',
  });

  private readonly id = nextChoiceCardsId++;
  private readonly projected = contentChildren(ChoiceCardComponent, {
    descendants: true,
  });
  private readonly buttons =
    viewChildren<ElementRef<HTMLButtonElement>>('optionButton');

  protected readonly options = computed(() =>
    this.projected().filter((option) => option.group === this),
  );

  private readonly checkedIndex = computed(() =>
    this.options().findIndex((option) => option.value() === this.value()),
  );

  protected readonly tabbableIndex = computed(() => {
    const checked = this.checkedIndex();
    if (checked >= 0) return checked;
    return this.options().findIndex((option) => !option.disabled());
  });

  private onChange: (value: T) => void = () => {};
  private onTouched: () => void = () => {};

  protected descriptionId(index: number) {
    return `pdz-choice-cards-${this.id}-${index}`;
  }

  protected isChecked(index: number) {
    return index === this.checkedIndex();
  }

  protected select(index: number) {
    const option = this.options()[index];
    if (!option || option.disabled() || this.disabled()) return;
    const selected = option.value() as T;
    this.value.set(selected);
    this.onChange(selected);
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
    if (!options.length || this.disabled()) return undefined;
    for (let i = 1; i <= options.length; i++) {
      const index = (from + step * i + options.length * i) % options.length;
      if (!options[index].disabled()) return index;
    }
    return undefined;
  }

  writeValue(value: T) {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }
}
