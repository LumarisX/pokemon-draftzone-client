import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { environment } from '@pdz/environments/environment';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import type { ClientError } from './error.service';
import { ErrorService } from './error.service';

type ReportState = 'sending' | 'sent' | 'failed';

@Component({
  selector: 'pdz-error',
  imports: [IconComponent, ButtonComponent],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent {
  private errorService = inject(ErrorService);
  private destroyRef = inject(DestroyRef);
  private copyTimers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly isDev = !environment.production;
  readonly errors = this.errorService.errors;

  readonly expanded = signal<ReadonlySet<string>>(new Set());
  readonly dismissing = signal<ReadonlySet<string>>(new Set());
  readonly copied = signal<ReadonlySet<string>>(new Set());
  readonly reports = signal<ReadonlyMap<string, ReportState>>(new Map());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.copyTimers.forEach((timer) => clearTimeout(timer));
      this.copyTimers.clear();
    });
  }

  dismissError(errorId: string): void {
    this.dismissing.update((ids) => withId(ids, errorId));
    setTimeout(() => {
      this.errorService.dismissError(errorId);
      this.expanded.update((ids) => withoutId(ids, errorId));
      this.dismissing.update((ids) => withoutId(ids, errorId));
    }, 600);
  }

  toggleDetails(errorId: string): void {
    this.expanded.update((ids) =>
      ids.has(errorId) ? withoutId(ids, errorId) : withId(ids, errorId),
    );
  }

  hasDetails(error: ClientError): boolean {
    return (
      !!error?.error?.details && Object.keys(error.error.details).length > 0
    );
  }

  hasStack(error: ClientError): boolean {
    return !!error?.error?.stack;
  }

  hasRequestId(error: ClientError): boolean {
    return !!error?.meta?.requestId;
  }

  detailEntries(error: ClientError): [string, unknown][] {
    return error?.error?.details ? Object.entries(error.error.details) : [];
  }

  formatDetailValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  async copyError(error: ClientError): Promise<void> {
    const report = this.buildErrorReport(error);
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = report;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
    }

    this.copied.update((ids) => withId(ids, error.id));
    const existing = this.copyTimers.get(error.id);
    if (existing) clearTimeout(existing);
    this.copyTimers.set(
      error.id,
      setTimeout(() => {
        this.copied.update((ids) => withoutId(ids, error.id));
        this.copyTimers.delete(error.id);
      }, 2000),
    );
  }

  reportState(errorId: string): ReportState | undefined {
    return this.reports().get(errorId);
  }

  sendReport(error: ClientError): void {
    const state = this.reportState(error.id);
    if (state === 'sending' || state === 'sent') return;

    this.setReport(error.id, 'sending');
    this.errorService.sendErrorReport(error).subscribe({
      next: (result) =>
        this.setReport(error.id, result?.delivered ? 'sent' : 'failed'),
      error: () => this.setReport(error.id, 'failed'),
    });
  }

  private setReport(errorId: string, state: ReportState): void {
    this.reports.update((reports) => new Map(reports).set(errorId, state));
  }

  private buildErrorReport(error: ClientError): string {
    const lines: string[] = ['Pokémon DraftZone — Error Report', ''];

    lines.push(
      error.status !== undefined && error.status !== 0
        ? `Error ${error.status}`
        : 'Error',
    );

    if (error.error?.code) lines.push(`Code: ${error.error.code}`);

    const message =
      error.error?.message ?? error.statusText ?? error.message ?? '';
    if (message) lines.push(`Message: ${message}`);

    if (error.url) lines.push(`URL: ${error.url}`);

    if (this.hasDetails(error)) {
      lines.push('', 'Details:');
      for (const [key, value] of this.detailEntries(error)) {
        lines.push(`  ${key}: ${this.formatDetailValue(value)}`);
      }
    }

    if (error.meta?.requestId)
      lines.push('', `Request ID: ${error.meta.requestId}`);
    if (error.meta?.timestamp)
      lines.push(`Server time: ${error.meta.timestamp}`);

    if (this.hasStack(error)) {
      lines.push('', 'Stack trace:', error.error!.stack ?? '');
    }

    lines.push(
      '',
      '---',
      `Page: ${window.location.href}`,
      `Reported: ${new Date().toISOString()}`,
      `User agent: ${navigator.userAgent}`,
    );

    return lines.join('\n');
  }
}

function withId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  return new Set(ids).add(id);
}

function withoutId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}
