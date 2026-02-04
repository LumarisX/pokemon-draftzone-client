import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { IconComponent } from '../images/icon/icon.component';
import type { ClientError } from './error.service';
import { ErrorService } from './error.service';

@Component({
  selector: 'error',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss',
})
export class ErrorComponent implements OnInit, OnDestroy {
  private errorService = inject(ErrorService);
  private destroy$ = new Subject<void>();

  errors: ClientError[] = [];
  expandedErrorIds = new Set<string>();
  dismissingErrorIds = new Set<string>();

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
