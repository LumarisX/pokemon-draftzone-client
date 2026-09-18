import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { CustomSlotComponent } from './custom-slot.component';
import { ControlSpec } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

@Component({
  selector: 'pdz-node-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
    CustomSlotComponent,
  ],
  template: `
    @let control = spec();
    @switch (control.kind) {
      @case ('text') {
        <label pdz-field [label]="control.label" [required]="!!control.required">
          <input
            pdz-input
            type="text"
            [disabled]="disabled()"
            [placeholder]="control.placeholder ?? ''"
            [attr.maxlength]="control.maxLength ?? null"
            [ngModel]="text()"
            (ngModelChange)="set($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
      }
      @case ('textarea') {
        <label pdz-field [label]="control.label">
          <textarea
            pdz-input
            [rows]="control.rows ?? 3"
            [disabled]="disabled()"
            [ngModel]="text()"
            (ngModelChange)="set($event)"
            [ngModelOptions]="{ standalone: true }"
          ></textarea>
        </label>
      }
      @case ('number') {
        <label pdz-field [label]="control.label" [hint]="control.unit">
          <input
            pdz-input
            class="node-control__number"
            type="number"
            [attr.min]="control.min ?? null"
            [attr.max]="control.max ?? null"
            [disabled]="disabled()"
            [ngModel]="number()"
            (ngModelChange)="set($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
      }
      @case ('toggle') {
        <label pdz-check>
          <input
            pdz-checkbox
            type="checkbox"
            [disabled]="disabled()"
            [ngModel]="boolean()"
            (ngModelChange)="set($event)"
            [ngModelOptions]="{ standalone: true }"
          />
          <span>{{ control.label }}</span>
        </label>
      }
      @case ('choice') {
        @if (control.as === 'radio') {
          <div pdz-field [label]="control.label">
            <div class="node-control__choices">
              @for (option of control.options; track option.value) {
                <label pdz-check>
                  <input
                    pdz-radio
                    type="radio"
                    [name]="control.key"
                    [value]="option.value"
                    [disabled]="disabled()"
                    [ngModel]="text()"
                    (ngModelChange)="set($event)"
                    [ngModelOptions]="{ standalone: true }"
                  />
                  <span>{{ option.label }}</span>
                </label>
              }
            </div>
          </div>
        } @else {
          <div pdz-field [label]="control.label">
            <pdz-select
              [attr.aria-label]="control.label"
              [disabled]="disabled()"
              [ngModel]="text()"
              (ngModelChange)="set($event)"
              [ngModelOptions]="{ standalone: true }"
            >
              @for (option of control.options; track option.value) {
                <pdz-option [value]="option.value" [label]="option.label" />
              }
            </pdz-select>
          </div>
        }
      }
      @case ('datetime') {
        <label pdz-field [label]="control.label" [required]="!!control.required">
          <input
            pdz-input
            type="datetime-local"
            [disabled]="disabled()"
            [ngModel]="text()"
            (ngModelChange)="set($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </label>
      }
      @case ('tags') {
        <div pdz-field [label]="control.label">
          <div class="node-control__choices">
            @for (option of control.options; track option.value) {
              <label pdz-check>
                <input
                  pdz-checkbox
                  type="checkbox"
                  [disabled]="disabled()"
                  [checked]="tags().includes(option.value)"
                  (change)="toggleTag(option.value)"
                />
                <span>{{ option.label }}</span>
              </label>
            }
          </div>
        </div>
      }
      @case ('custom') {
        <pdz-custom-slot [control]="control" [disabled]="disabled()" />
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .node-control__number {
        max-width: 8rem;
      }
      .node-control__choices {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
    `,
  ],
})
export class NodeControlComponent {
  readonly spec = input.required<ControlSpec>();
  readonly disabled = input(false);

  private readonly store = inject(SettingsWorkbenchStore);

  private readonly key = computed(() => {
    const control = this.spec();
    return control.kind === 'custom' ? null : control.key;
  });

  protected readonly text = computed(() => {
    const key = this.key();
    return key ? (this.store.read<string>(key) ?? '') : '';
  });

  protected readonly number = computed(() => {
    const key = this.key();
    return key ? (this.store.read<number>(key) ?? 0) : 0;
  });

  protected readonly boolean = computed(() => {
    const key = this.key();
    return key ? !!this.store.read<boolean>(key) : false;
  });

  protected readonly tags = computed(() => {
    const key = this.key();
    return key ? (this.store.read<string[]>(key) ?? []) : [];
  });

  protected set(value: unknown): void {
    const key = this.key();
    if (key) this.store.write(key, value);
  }

  protected toggleTag(value: string): void {
    const current = this.tags();
    this.set(
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  }
}
