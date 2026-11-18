import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { ChatReport, ChatReportResolution } from '../league-chat/league-chat.model';
import { ChatReportRowComponent } from './chat-report-row.component';

export interface ChatReportsSource {
  load: () => Observable<{ reports: ChatReport[] }>;
  resolve: (
    reportId: string,
    action: ChatReportResolution,
  ) => Observable<unknown>;
}

@Component({
  selector: 'pdz-chat-reports-list',
  imports: [
    CardComponent,
    ChatReportRowComponent,
    EmptyStateComponent,
    SkeletonLayoutComponent,
  ],
  template: `
    @if (loading()) {
      <pdz-skeleton-layout layout="list" count="3" />
    } @else if (loadFailed()) {
      <pdz-empty-state
        bordered
        kind="error"
        heading="Could not load reports"
        message="The chat reports did not come back from the server."
        retry="event"
        (retried)="load()"
      />
    } @else if (!reports().length) {
      <pdz-empty-state
        bordered
        kind="empty"
        heading="No open reports"
        message="Reported chat messages appear here until someone acts on them."
      />
    } @else {
      <pdz-card padding="lg">
        @for (report of reports(); track report.id) {
          <pdz-chat-report-row
            [report]="report"
            [busy]="busyId() === report.id"
            (dismissed)="dismiss(report)"
            (removed)="remove(report)"
          />
        }
      </pdz-card>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatReportsListComponent implements OnInit {
  readonly source = input.required<ChatReportsSource>();

  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly reports = signal<ChatReport[]>([]);
  protected readonly busyId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.source()
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ reports }) => {
          this.reports.set(reports);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }

  protected dismiss(report: ChatReport): void {
    this.resolve(report, 'dismiss');
  }

  protected async remove(report: ChatReport): Promise<void> {
    const confirmed = await this.dialogs.confirm('Remove Message', {
      message:
        'This deletes the message for everyone and closes every report about it.',
      confirmLabel: 'Remove Message',
      confirmColor: 'danger',
    });
    if (confirmed) this.resolve(report, 'remove');
  }

  private resolve(report: ChatReport, action: ChatReportResolution): void {
    if (this.busyId()) return;
    this.busyId.set(report.id);
    this.source()
      .resolve(report.id, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.leave(report, action);
        },
        error: (error) => {
          this.busyId.set(null);
          if (error instanceof ApiError && error.code === 'CH-006') {
            this.leave(report, 'dismiss');
          }
          this.toast.error(apiErrorMessage(error, 'Could not update that report.'));
        },
      });
  }

  private leave(report: ChatReport, action: ChatReportResolution): void {
    this.reports.update((reports) =>
      reports.filter((entry) =>
        action === 'remove'
          ? entry.messageId !== report.messageId
          : entry.id !== report.id,
      ),
    );
  }
}
