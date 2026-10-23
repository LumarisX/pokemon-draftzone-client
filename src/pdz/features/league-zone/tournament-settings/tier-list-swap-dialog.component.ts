import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { TierListChangesComponent } from '@pdz/features/tier-lists/tier-list-changes/tier-list-changes.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { FieldHintDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { LOG_REASON_MAX } from '../tournament-log/tournament-log.service';
import { SwapPreview, TournamentTierListService } from './tournament-tier-list.service';

export type SwapDialogData = { slug: string; name: string; replacing: boolean };

@Component({
  selector: 'pdz-tier-list-swap-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    DisclosureComponent,
    EmptyStateComponent,
    FieldComponent,
    FieldHintDirective,
    InputDirective,
    SkeletonLayoutComponent,
    TierListChangesComponent,
  ],
  templateUrl: './tier-list-swap-dialog.component.html',
  styleUrl: './tier-list-swap-dialog.component.scss',
})
export class TierListSwapDialogComponent implements OnInit {
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly data = inject<SwapDialogData>(DIALOG_DATA);
  private readonly service = inject(TournamentTierListService);
  private readonly toasts = inject(ToastService);

  protected readonly preview = signal<SwapPreview | null>(null);
  protected readonly failed = signal(false);
  protected readonly reason = signal('');
  protected readonly saving = signal(false);
  protected readonly reasonMax = LOG_REASON_MAX;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.service.preview(this.data.slug).subscribe({
      next: (preview) => this.preview.set(preview),
      error: () => this.failed.set(true),
    });
  }

  protected keptRequirements(preview: SwapPreview): string {
    return preview.requirements
      .filter((entry) => entry.kept)
      .map((entry) => entry.tierName)
      .join(', ');
  }

  protected clearedRequirements(preview: SwapPreview): string {
    return preview.requirements
      .filter((entry) => !entry.kept)
      .map((entry) => entry.tierName)
      .join(', ');
  }

  protected confirm(): void {
    this.saving.set(true);
    this.service
      .attach({
        tierListSlug: this.data.slug,
        ...(this.reason().trim() && { reason: this.reason().trim() }),
      })
      .subscribe({
        next: (result) => {
          this.toasts.success(result.message);
          this.ref.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          this.toasts.error(apiErrorMessage(err, 'Could not change the tier list.'));
        },
      });
  }
}
