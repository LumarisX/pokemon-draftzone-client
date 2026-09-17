import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { BinderStore, CARDS_PER_SHEET } from './binder-store';

@Component({
  selector: 'pdz-binder-print-dialog',
  imports: [
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  template: `
    <div class="print-dialog">
      <pdz-segmented
        [value]="store.printScope()"
        (valueChange)="store.setPrintScope($any($event))"
        aria-label="Which cards to print"
      >
        <pdz-segmented-option value="missing" label="Missing only" />
        <pdz-segmented-option value="all" label="All cards" />
      </pdz-segmented>

      <div class="print-dialog__range">
        <label pdz-field label="From page" inline>
          <input
            #from
            pdz-input
            type="number"
            min="1"
            [max]="store.stats().pages"
            placeholder="first"
            [value]="store.printFrom() ?? ''"
            (change)="setRange(from.value, to.value)"
          />
        </label>
        <label pdz-field label="To page" inline>
          <input
            #to
            pdz-input
            type="number"
            min="1"
            [max]="store.stats().pages"
            placeholder="last"
            [value]="store.printTo() ?? ''"
            (change)="setRange(from.value, to.value)"
          />
        </label>
      </div>

      <p class="print-dialog__summary">
        {{ store.printTargets().length }} placeholders ·
        {{ store.sheets().length }} sheets · {{ perSheet }} per sheet at 63 × 88 mm
      </p>

      <p class="print-dialog__hint">
        In the print dialog set Scale to 100% and turn off headers and footers,
        or the placeholders will not match a real card.
      </p>
    </div>

    <div class="pdz-dialog-actions">
      <button
        pdz-button
        variant="outlined"
        color="neutral"
        (click)="ref.close(false)"
      >
        Cancel
      </button>
      <button
        pdz-button
        icon="print"
        [disabled]="!store.sheets().length"
        (click)="ref.close(true)"
      >
        Print
      </button>
    </div>
  `,
  styles: [
    `
      .print-dialog {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .print-dialog__range {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .print-dialog__summary,
      .print-dialog__hint {
        margin: 0;
        font-size: 0.875rem;
      }

      .print-dialog__hint {
        color: var(--pdz-color-on-surface-variant);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BinderPrintDialogComponent {
  protected readonly store = inject(BinderStore);
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly perSheet = CARDS_PER_SHEET;

  protected setRange(from: string, to: string): void {
    const parse = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    };
    this.store.setPrintRange(parse(from), parse(to));
  }
}
