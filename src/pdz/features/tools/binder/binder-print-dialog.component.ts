import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { binderFileName, downloadFile } from './binder-download';
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
        [value]="store.printFormat()"
        (valueChange)="store.setPrintFormat($any($event))"
        aria-label="Format"
      >
        <pdz-segmented-option value="placeholders" label="Placeholders" />
        <pdz-segmented-option value="checklist" label="Checklist" />
      </pdz-segmented>

      <pdz-segmented
        [value]="store.printScope()"
        (valueChange)="store.setPrintScope($any($event))"
        aria-label="Which cards to include"
      >
        <pdz-segmented-option value="missing" label="Missing Only" />
        <pdz-segmented-option value="all" label="All Cards" />
      </pdz-segmented>

      <div class="print-dialog__range">
        <label pdz-field label="From Page" inline>
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
        <label pdz-field label="To Page" inline>
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

      @if (store.printFormat() === 'checklist') {
        <p class="print-dialog__summary">
          {{ store.printTargets().length }} cards across
          {{ store.printPages().length }} binder pages, grouped by page with
          the pocket number
        </p>
        <p class="print-dialog__hint">
          Copy or download it as plain text, or print it and choose Save as PDF
          as the printer.
        </p>
      } @else {
        <p class="print-dialog__summary">
          {{ store.printTargets().length }} placeholders ·
          {{ store.sheets().length }} sheets · {{ perSheet }} per sheet at 63 ×
          88 mm
        </p>
        <p class="print-dialog__hint">
          In the print dialog set Scale to 100% and turn off headers and
          footers, or the placeholders will not match a real card.
        </p>
      }
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
      @if (store.printFormat() === 'checklist') {
        <button
          pdz-button
          variant="outlined"
          color="neutral"
          icon="content_copy"
          [disabled]="!store.printTargets().length"
          (click)="copy()"
        >
          Copy
        </button>
        <button
          pdz-button
          variant="outlined"
          color="neutral"
          icon="download"
          [disabled]="!store.printTargets().length"
          (click)="download()"
        >
          Download
        </button>
      }
      <button
        pdz-button
        icon="print"
        [disabled]="!store.printTargets().length"
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
        gap: var(--pdz-space-lg);
      }

      .print-dialog__range {
        display: flex;
        flex-wrap: wrap;
        gap: var(--pdz-space-md);
      }

      .print-dialog__summary,
      .print-dialog__hint {
        margin: 0;
        font-size: var(--pdz-font-size-sm);
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
  private readonly clipboard = inject(Clipboard);
  private readonly toast = inject(ToastService);
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

  protected copy(): void {
    if (this.clipboard.copy(this.store.checklistText())) {
      this.toast.success(
        `Copied ${this.store.printTargets().length} cards to the clipboard.`,
      );
    } else {
      this.toast.error('Could not copy the list. Try Download instead.');
    }
  }

  protected download(): void {
    downloadFile(
      this.store.checklistText(),
      binderFileName(
        this.store.activeName(),
        this.store.printScope() === 'missing' ? 'missing' : 'checklist',
        'txt',
      ),
      'text/plain;charset=utf-8',
    );
  }
}
