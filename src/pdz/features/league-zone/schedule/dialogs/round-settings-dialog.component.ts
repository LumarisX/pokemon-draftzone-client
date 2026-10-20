import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
  DialogService,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';

export interface RoundSettings {
  name: string;
  matchDeadline: string | null;
  tradeDeadline: string | null;
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

@Component({
  selector: 'pdz-round-settings-dialog',
  imports: [ButtonComponent, FieldComponent, InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="round-settings">
      <label pdz-field label="Week Name">
        <input
          pdz-input
          type="text"
          [value]="name()"
          (input)="name.set($any($event.target).value)"
        />
      </label>
      <label pdz-field label="Match Deadline">
        <input
          pdz-input
          type="datetime-local"
          [value]="matchDeadline()"
          (input)="matchDeadline.set($any($event.target).value)"
        />
      </label>
      <label pdz-field label="Trade Deadline">
        <input
          pdz-input
          type="datetime-local"
          [value]="tradeDeadline()"
          (input)="tradeDeadline.set($any($event.target).value)"
        />
      </label>
    </div>

    <div class="pdz-dialog-actions">
      <button pdz-button variant="ghost" color="neutral" (click)="ref.close()">
        Cancel
      </button>
      <button pdz-button (click)="save()">Save Week</button>
    </div>
  `,
  styles: `
    .round-settings {
      display: flex;
      flex-direction: column;
      gap: var(--pdz-space-md);
    }
  `,
})
export class RoundSettingsDialogComponent {
  private readonly data = inject(DIALOG_DATA) as RoundSettings;
  protected readonly ref = inject(DialogRef) as DialogRef<RoundSettings>;

  protected readonly name = signal(this.data.name);
  protected readonly matchDeadline = signal(toLocalInput(this.data.matchDeadline));
  protected readonly tradeDeadline = signal(toLocalInput(this.data.tradeDeadline));

  protected save(): void {
    this.ref.close({
      name: this.name().trim() || this.data.name,
      matchDeadline: fromLocalInput(this.matchDeadline()),
      tradeDeadline: fromLocalInput(this.tradeDeadline()),
    });
  }
}

export function editRoundSettings(
  dialogs: DialogService,
  data: RoundSettings,
): Promise<RoundSettings | undefined> {
  return dialogs.open<RoundSettingsDialogComponent, RoundSettings, RoundSettings>(
    RoundSettingsDialogComponent,
    { heading: `${data.name} Settings`, size: 'sm', data },
  ).closed;
}
