import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { TierListChangesComponent } from '@pdz/features/tier-lists/tier-list-changes/tier-list-changes.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA, DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { LOG_REASON_MAX } from '../tournament-log/tournament-log.service';
import { SourceStatus, TournamentTierListService } from './tournament-tier-list.service';

export type PullDialogData = { version: number };

@Component({
  selector: 'pdz-tier-list-pull-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SkeletonLayoutComponent,
    TierListChangesComponent,
  ],
  template: `
    @if (failed()) {
      <pdz-empty-state
        size="sm"
        kind="error"
        heading="The source's changes didn't load"
        message="What changed in the source list didn't come back."
        retry="event"
        (retried)="load()"
      />
    } @else if (status(); as current) {
      @if (current.source) {
        <div class="pull">
          <p class="pull__intro">
            Changes made to {{ current.source.name }} since this tournament copied it.
            @if (!current.hasBase) {
              There's no record of the list when it was copied, so pulling makes this copy match
              it exactly.
            }
          </p>

          @if (current.conflicts?.length) {
            <section class="pull__group">
              <h3 class="pull__label">Changed in Both</h3>
              <p class="pull__text">You changed these too. Pick which version to keep.</p>
              <ul class="pull__conflicts">
                @for (conflict of current.conflicts; track conflict.pokemonId) {
                  <li class="pull__conflict">
                    <span class="pull__name">{{ conflict.name }}</span>
                    <pdz-segmented
                      size="sm"
                      [aria-label]="'Version of ' + conflict.name"
                      [ngModel]="resolutions()[conflict.pokemonId]"
                      (ngModelChange)="resolve(conflict.pokemonId, $event)"
                    >
                      <pdz-segmented-option value="current" label="Keep Ours" />
                      <pdz-segmented-option value="source" label="Take Theirs" />
                    </pdz-segmented>
                  </li>
                }
              </ul>
            </section>
          }

          <pdz-tier-list-changes
            [changes]="current.changes ?? []"
            emptyText="Nothing to pull. This copy already has the source's changes."
          />

          <label pdz-field label="Note for the Log">
            <textarea
              pdz-input
              rows="2"
              [maxlength]="reasonMax"
              placeholder="Why now (optional)"
              [ngModel]="reason()"
              (ngModelChange)="reason.set($event)"
            ></textarea>
          </label>
        </div>

        <div class="pdz-dialog-actions">
          <button pdz-button variant="outlined" color="neutral" [disabled]="saving()" (click)="ref.close()">
            Cancel
          </button>
          <button pdz-button [loading]="saving()" [disabled]="!canPull()" (click)="pull()">
            Pull Changes
          </button>
        </div>
      } @else {
        <pdz-empty-state
          size="sm"
          kind="empty"
          heading="No source to pull from"
          message="This list wasn't copied from a list you can see."
        />
      }
    } @else {
      <pdz-skeleton-layout layout="list" [count]="4" />
    }
  `,
  styleUrl: './tier-list-pull-dialog.component.scss',
})
export class TierListPullDialogComponent implements OnInit {
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly data = inject<PullDialogData>(DIALOG_DATA);
  private readonly service = inject(TournamentTierListService);
  private readonly toasts = inject(ToastService);

  protected readonly status = signal<SourceStatus | null>(null);
  protected readonly failed = signal(false);
  protected readonly resolutions = signal<Record<string, 'source' | 'current'>>({});
  protected readonly reason = signal('');
  protected readonly saving = signal(false);
  protected readonly reasonMax = LOG_REASON_MAX;

  protected readonly canPull = computed(() => {
    const status = this.status();
    if (!status?.source || this.saving()) return false;
    const conflicts = status.conflicts ?? [];
    const resolved = conflicts.every((conflict) => this.resolutions()[conflict.pokemonId]);
    return resolved && (!!status.changes?.length || conflicts.length > 0);
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.service.source().subscribe({
      next: (status) => this.status.set(status),
      error: () => this.failed.set(true),
    });
  }

  protected resolve(pokemonId: string, choice: 'source' | 'current'): void {
    this.resolutions.update((current) => ({ ...current, [pokemonId]: choice }));
  }

  protected pull(): void {
    this.saving.set(true);
    this.service
      .pull({
        version: this.data.version,
        resolutions: this.resolutions(),
        ...(this.reason().trim() && { reason: this.reason().trim() }),
      })
      .subscribe({
        next: (result) => {
          this.toasts.success(result.summary ? `Pulled: ${result.summary}` : result.message);
          this.ref.close(true);
        },
        error: (err) => {
          this.saving.set(false);
          if (toApiError(err)?.code === 'LR-TIER-005') {
            this.toasts.error('The list changed while you were looking. Close this and try again.');
            return;
          }
          this.toasts.error(apiErrorMessage(err, 'Could not pull the changes.'));
        },
      });
  }
}
