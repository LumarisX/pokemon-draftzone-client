import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { RumService } from '@pdz/core/services/rum.service';
import { environment } from '@pdz/environments/environment';
import { Observable } from 'rxjs';

function toMessageString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value.join('; ');
  }
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

export interface PDZError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PDZErrorMeta {
  requestId?: string;
  timestamp?: string;
}

export interface PDZErrorResponse {
  error: PDZError;
  meta?: PDZErrorMeta;
}

type ErrorBody = {
  error?: {
    code?: string;
    message?: unknown;
    details?: Record<string, unknown>;
    stack?: string;
  };
  meta?: PDZErrorMeta;
};

function isClientError(value: unknown): value is ClientError {
  return (
    !!value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as ClientError).message === 'string'
  );
}

export interface ClientError {
  id: string;
  message: string;
  status?: number;
  statusText?: string;
  url?: string | null;
  error?: PDZError;
  meta?: PDZErrorMeta;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private rumService = inject(RumService);
  private http = inject(HttpClient);
  private readonly MAX_ERRORS = 5;
  private readonly errorList = signal<ClientError[]>([]);
  private errorIdCounter = 0;

  readonly errors = this.errorList.asReadonly();

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  sendErrorReport(error: ClientError): Observable<{ delivered: boolean }> {
    const payload = {
      status: error.status,
      code: error.error?.code,
      message: toMessageString(
        error.error?.message ?? error.statusText ?? error.message,
      ).slice(0, 2000),
      url: error.url ?? undefined,
      details: error.error?.details,
      requestId: error.meta?.requestId,
      stack: error.error?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<{ delivered: boolean }>(
      `${this.serverUrl}/error-report`,
      payload,
      { headers },
    );
  }

  reportError(error: unknown): void {
    const clientError = this.toClientError(error);
    const current = this.errorList();
    if (current.some((existing) => this.areEquivalent(existing, clientError))) {
      return;
    }
    this.errorList.set([clientError, ...current].slice(0, this.MAX_ERRORS));
    this.rumService.recordClientError(clientError);
  }

  dismissError(errorId: string): void {
    this.errorList.update((errors) => errors.filter((e) => e.id !== errorId));
  }

  clearAllErrors(): void {
    this.errorList.set([]);
  }

  private areEquivalent(a: ClientError, b: ClientError): boolean {
    return (
      a.message === b.message &&
      a.status === b.status &&
      a.statusText === b.statusText &&
      a.url === b.url &&
      a.error?.code === b.error?.code &&
      a.error?.message === b.error?.message &&
      JSON.stringify(a.error?.details) === JSON.stringify(b.error?.details)
    );
  }

  private nextErrorId(): string {
    return `error-${++this.errorIdCounter}-${Date.now()}`;
  }

  private toClientError(error: unknown): ClientError {
    if (error instanceof HttpErrorResponse) return this.parseHttpError(error);

    if (isClientError(error)) {
      return { ...error, id: error.id || this.nextErrorId() };
    }

    return {
      id: this.nextErrorId(),
      message: toMessageString(
        (error as { message?: unknown } | null)?.message ?? error,
      ),
    };
  }

  private parseHttpError(httpError: HttpErrorResponse): ClientError {
    const clientError: ClientError = {
      id: this.nextErrorId(),
      message: httpError.message,
      status: httpError.status,
      statusText: httpError.statusText,
      url: httpError.url,
    };

    if (httpError.error && typeof httpError.error === 'object') {
      const body = httpError.error as ErrorBody;

      if (body.error) {
        clientError.error = {
          code: body.error.code || 'UNKNOWN_ERROR',
          message: toMessageString(body.error.message || httpError.statusText),
          details: body.error.details,
          stack: body.error.stack,
        };
      }

      if (body.meta) {
        clientError.meta = {
          requestId: body.meta.requestId,
          timestamp: body.meta.timestamp,
        };
      }
    }

    return clientError;
  }
}
