import {
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ButtonColor,
  ButtonComponent,
  ButtonSize,
  ButtonVariant,
} from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { CardComponent, CardPadding, CardTone } from '@pdz/shared/data/card/card.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

const THEME_ATTR = 'pdz-theme';
const MODE_ATTR = 'pdz-theme-mode';

@Component({
  selector: 'pdz-debug-components',
  imports: [ButtonComponent, IconComponent, FieldComponent, InputDirective, ReactiveFormsModule, CheckComponent, ChoiceDirective, CardComponent],
  templateUrl: './debug-components.component.html',
  styleUrl: './debug-components.component.scss',
})
export class DebugComponentsComponent {
  readonly variants: ButtonVariant[] = [
    'filled',
    'tonal',
    'outlined',
    'ghost',
    'link',
  ];
  readonly colors: ButtonColor[] = [
    'primary',
    'secondary',
    'neutral',
    'danger',
  ];
  readonly sizes: ButtonSize[] = ['sm', 'md', 'lg'];
  readonly themes = ['classic', 'classic-reverse', 'fern', 'shiny', 'sunset'];

  theme = signal('classic');
  mode = signal<'light' | 'dark'>('light');
  loadingDemo = signal(false);

  constructor() {
    const root = document.documentElement;
    const previous = {
      theme: root.getAttribute(THEME_ATTR),
      mode: root.getAttribute(MODE_ATTR),
    };

    effect(() => {
      root.setAttribute(THEME_ATTR, this.theme());
      root.setAttribute(MODE_ATTR, this.mode());
    });

    inject(DestroyRef).onDestroy(() => {
      this.restore(root, THEME_ATTR, previous.theme);
      this.restore(root, MODE_ATTR, previous.mode);
    });
  }

  private restore(root: HTMLElement, attr: string, value: string | null) {
    if (value === null) {
      root.removeAttribute(attr);
    } else {
      root.setAttribute(attr, value);
    }
  }

  readonly requiredCtrl = new FormControl('', Validators.required);

  touchRequired() {
    this.requiredCtrl.markAsTouched();
  }

  readonly tones: CardTone[] = ['lowest', 'low', 'default', 'high'];
  readonly paddings: CardPadding[] = ['none', 'sm', 'md', 'lg'];

  indeterminate = true;

  setIndeterminate(el: HTMLInputElement) {
    el.indeterminate = this.indeterminate;
  }

  toggleLoading() {
    this.loadingDemo.update((v) => !v);
  }
}
