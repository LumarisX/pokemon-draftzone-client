import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import {
  DIALOG_DATA,
  DialogRef,
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';

export interface RoundSettingsData {
  name: string;
  matchDeadline: string;
  tradeDeadline: string;
}

@Component({
  selector: 'pdz-round-settings-dialog',
  imports: [ButtonComponent, FieldComponent, InputDirective],
  template: `
    <div class="round-settings">
      <label pdz-field label="Round name">
        <input
          pdz-input
          type="text"
          [value]="name()"
          (input)="name.set($any($event.target).value)"
        />
      </label>

      <label
        pdz-field
        label="Match deadline"
        hint="When these matches have to be played by."
      >
        <input
          pdz-input
          type="datetime-local"
          [value]="matchDeadline()"
          (input)="matchDeadline.set($any($event.target).value)"
        />
      </label>

      <label
        pdz-field
        label="Trade deadline"
        hint="Coaches cannot file trades for this round after this."
      >
        <input
          pdz-input
          type="datetime-local"
          [value]="tradeDeadline()"
          (input)="tradeDeadline.set($any($event.target).value)"
        />
      </label>
    </div>

    <div class="pdz-dialog-actions">
      <button
        pdz-button
        variant="outlined"
        color="neutral"
        (click)="ref.close()"
      >
        Cancel
      </button>
      <button pdz-button (click)="save()">Save round</button>
    </div>
  `,
  styles: `
    .round-settings {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoundSettingsDialogComponent {
  private readonly data = inject(DIALOG_DATA) as RoundSettingsData;
  protected readonly ref = inject(DialogRef) as DialogRef<RoundSettingsData>;

  protected readonly name = signal(this.data.name);
  protected readonly matchDeadline = signal(this.data.matchDeadline);
  protected readonly tradeDeadline = signal(this.data.tradeDeadline);

  protected save(): void {
    this.ref.close({
      name: this.name().trim() || this.data.name,
      matchDeadline: this.matchDeadline(),
      tradeDeadline: this.tradeDeadline(),
    });
  }
}

export function editRoundSettings(
  dialogs: DialogService,
  roundName: string,
  data: RoundSettingsData,
): Promise<RoundSettingsData | undefined> {
  return dialogs.open<
    RoundSettingsDialogComponent,
    RoundSettingsData,
    RoundSettingsData
  >(RoundSettingsDialogComponent, {
    heading: `${roundName} settings`,
    size: 'sm',
    data,
  }).closed;
}
