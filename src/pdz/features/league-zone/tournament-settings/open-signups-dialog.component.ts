import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';

export interface OpenSignUpsDialogData {
  deadline: string;
  access: 'open' | 'invite' | 'closed';
}

export interface OpenSignUpsDialogResult {
  deadline: string;
  access: 'open' | 'invite';
}

const DEFAULT_OPEN_DAYS = 14;

function localInput(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultDeadline(current: string): string {
  const existing = current ? new Date(current) : null;
  if (existing && existing.getTime() > Date.now()) return current;
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_OPEN_DAYS);
  date.setHours(20, 0, 0, 0);
  return localInput(date);
}

@Component({
  selector: 'pdz-open-signups-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  template: `
    <form class="open" (ngSubmit)="submit()">
      <label
        pdz-field
        label="Sign-Ups Close"
        hint="Coaches can apply until then. You can change it later in Settings."
        required
        [error]="touched() && deadlineError() ? deadlineError() : null"
      >
        <input
          pdz-input
          type="datetime-local"
          name="deadline"
          [ngModel]="deadline()"
          (ngModelChange)="deadline.set($event)"
        />
      </label>

      <div pdz-field label="Who Can Apply">
        <pdz-segmented
          aria-label="Who Can Apply"
          [value]="access()"
          (valueChange)="access.set($event!)"
        >
          <pdz-segmented-option value="open" label="Anyone" />
          <pdz-segmented-option value="invite" label="Invite Link Only" />
        </pdz-segmented>
      </div>

      <div class="pdz-dialog-actions">
        <button
          pdz-button
          type="button"
          variant="outlined"
          color="neutral"
          (click)="ref.close()"
        >
          Cancel
        </button>
        <button pdz-button type="submit">Open Sign-Ups</button>
      </div>
    </form>
  `,
  styleUrl: './open-signups-dialog.component.scss',
})
export class OpenSignUpsDialogComponent {
  protected readonly ref = inject(
    DialogRef,
  ) as DialogRef<OpenSignUpsDialogResult>;
  private readonly data = inject<OpenSignUpsDialogData>(DIALOG_DATA);

  protected readonly deadline = signal(defaultDeadline(this.data.deadline));
  protected readonly access = signal<'open' | 'invite'>(
    this.data.access === 'invite' ? 'invite' : 'open',
  );
  protected readonly touched = signal(false);

  protected readonly deadlineError = computed(() => {
    const value = this.deadline();
    if (!value) return 'Pick when sign-ups close.';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Pick when sign-ups close.';
    if (date.getTime() <= Date.now()) return 'Pick a time in the future.';
    return null;
  });

  protected submit(): void {
    this.touched.set(true);
    if (this.deadlineError()) return;
    this.ref.close({ deadline: this.deadline(), access: this.access() });
  }
}
