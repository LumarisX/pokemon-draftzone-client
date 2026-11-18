import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { AdminNavComponent } from '../admin-nav.component';
import { AdminService } from '../admin.service';

export const RESET_NOTE_MAX = 300;

const PROFILE_ID_PATTERN = /[0-9a-f]{24}/i;

export function extractProfileId(value: string): string | null {
  const match = PROFILE_ID_PATTERN.exec(value);
  return match ? match[0].toLowerCase() : null;
}

@Component({
  selector: 'pdz-reset-display-name',
  imports: [
    FormsModule,
    AdminNavComponent,
    ButtonComponent,
    CardComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './reset-display-name.component.html',
  styleUrl: './reset-display-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetDisplayNameComponent {
  private readonly admin = inject(AdminService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);

  protected readonly noteMax = RESET_NOTE_MAX;
  protected readonly profile = signal('');
  protected readonly note = signal('');
  protected readonly profileError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  protected readonly resetting = signal(false);

  protected readonly profileId = computed(() =>
    extractProfileId(this.profile()),
  );

  protected readonly ready = computed(
    () => !!this.profileId() && !!this.note().trim(),
  );

  protected onProfile(value: string): void {
    this.profile.set(value ?? '');
    this.profileError.set(null);
  }

  protected async submit(): Promise<void> {
    const profileId = this.profileId();
    if (!profileId || !this.ready() || this.resetting()) return;
    const confirmed = await this.dialogs.confirm('Reset Display Name', {
      message:
        'This replaces the display name on that account with a generic one. The person can choose a new name in their settings.',
      confirmLabel: 'Reset Name',
      confirmColor: 'danger',
    });
    if (!confirmed) return;

    this.resetting.set(true);
    this.profileError.set(null);
    this.formError.set(null);
    this.admin.resetDisplayName(profileId, this.note().trim()).subscribe({
      next: () => {
        this.resetting.set(false);
        this.profile.set('');
        this.note.set('');
        this.toast.success('Display name reset.');
      },
      error: (error) => {
        this.resetting.set(false);
        const message = apiErrorMessage(
          error,
          'Could not reset that display name.',
        );
        if (error instanceof ApiError && error.status === 404) {
          this.profileError.set(message);
        } else {
          this.formError.set(message);
        }
      },
    });
  }
}
