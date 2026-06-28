import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '@pdz/environments/environment';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import type { ClientError } from './error.service';
import { ErrorService } from './error.service';

@Component({
  selector: 'pdz-error',
  imports: [CommonModule, IconComponent],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
})
export class ErrorComponent implements OnInit, OnDestroy {
  private errorService = inject(ErrorService);
  private destroy$ = new Subject<void>();

  readonly isDev = !environment.production;

  errors: ClientError[] = [];
  expandedErrorIds = new Set<string>();
  dismissingErrorIds = new Set<string>();
  copiedErrorIds = new Set<string>();
  reportingErrorIds = new Set<string>();
  reportedErrorIds = new Set<string>();
  reportFailedErrorIds = new Set<string>();
  private copyResetTimers = new Map<string, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    this.errorService
      .getErrorsObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe((errors) => {
        this.errors = errors;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.copyResetTimers.forEach((timer) => clearTimeout(timer));
    this.copyResetTimers.clear();
  }

  dismissError(errorId: string): void {
    this.dismissingErrorIds.add(errorId);
    setTimeout(() => {
      this.errorService.dismissError(errorId);
      this.expandedErrorIds.delete(errorId);
      this.dismissingErrorIds.delete(errorId);
    }, 600);
  }

  isDismissing(errorId: string): boolean {
    return this.dismissingErrorIds.has(errorId);
  }

  toggleDetails(errorId: string): void {
    if (this.expandedErrorIds.has(errorId)) {
      this.expandedErrorIds.delete(errorId);
    } else {
      this.expandedErrorIds.add(errorId);
    }
  }

  isExpanded(errorId: string): boolean {
    return this.expandedErrorIds.has(errorId);
  }

  hasDetails(error: ClientError): boolean {
    return (
      !!error?.error?.details && Object.keys(error.error.details).length > 0
    );
  }

  getDetailsEntries(error: ClientError): [string, unknown][] {
    if (!error?.error?.details) return [];
    return Object.entries(error.error.details);
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
      // Fallback for browsers/contexts without the async clipboard API.
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

    this.copiedErrorIds.add(error.id);
    const existing = this.copyResetTimers.get(error.id);
    if (existing) clearTimeout(existing);
    this.copyResetTimers.set(
      error.id,
      setTimeout(() => {
        this.copiedErrorIds.delete(error.id);
        this.copyResetTimers.delete(error.id);
      }, 2000),
    );
  }

  isCopied(errorId: string): boolean {
    return this.copiedErrorIds.has(errorId);
  }

  sendReport(error: ClientError): void {
    if (
      this.reportingErrorIds.has(error.id) ||
      this.reportedErrorIds.has(error.id)
    ) {
      return;
    }

    this.reportFailedErrorIds.delete(error.id);
    this.reportingErrorIds.add(error.id);

    this.errorService
      .sendErrorReport(error)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.reportingErrorIds.delete(error.id);
          if (result?.delivered) {
            this.reportedErrorIds.add(error.id);
          } else {
            this.reportFailedErrorIds.add(error.id);
          }
        },
        error: () => {
          this.reportingErrorIds.delete(error.id);
          this.reportFailedErrorIds.add(error.id);
        },
      });
  }

  isReporting(errorId: string): boolean {
    return this.reportingErrorIds.has(errorId);
  }

  isReported(errorId: string): boolean {
    return this.reportedErrorIds.has(errorId);
  }

  reportFailed(errorId: string): boolean {
    return this.reportFailedErrorIds.has(errorId);
  }

  private buildErrorReport(error: ClientError): string {
    const lines: string[] = ['Pokémon DraftZone — Error Report', ''];

    const title =
      error.status !== undefined && error.status !== 0
        ? `Error ${error.status}`
        : 'Error';
    lines.push(title);

    if (error.error?.code) lines.push(`Code: ${error.error.code}`);

    const message =
      error.error?.message ?? error.statusText ?? error.message ?? '';
    if (message) lines.push(`Message: ${message}`);

    if (error.url) lines.push(`URL: ${error.url}`);

    if (this.hasDetails(error)) {
      lines.push('', 'Details:');
      for (const [key, value] of this.getDetailsEntries(error)) {
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

  hasStack(error: ClientError): boolean {
    return !!error?.error?.stack;
  }

  hasRequestId(error: ClientError): boolean {
    return !!error?.meta?.requestId;
  }

  trackByErrorId(index: number, error: ClientError): string {
    return error.id;
  }
}
