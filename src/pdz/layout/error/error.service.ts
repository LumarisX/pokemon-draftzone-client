import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthService } from '@pdz/core/services/auth0.service';
import { RumService } from '@pdz/core/services/rum.service';
import { environment } from '@pdz/environments/environment';
import { BehaviorSubject, Observable, of, switchMap, take } from 'rxjs';

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
  private auth = inject(AuthService);
  private readonly MAX_ERRORS = 5;
  private errorsSubject = new BehaviorSubject<ClientError[]>([]);
  private errorIdCounter = 0;

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  sendErrorReport(error: ClientError): Observable<{ delivered: boolean }> {
    const payload = {
      status: error.status,
      code: error.error?.code,
      message: error.error?.message ?? error.statusText ?? error.message,
      url: error.url ?? undefined,
      details: error.error?.details,
      requestId: error.meta?.requestId,
      stack: error.error?.stack,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    return this.auth.isAuthenticated$.pipe(
      take(1),
      switchMap((isAuthenticated) =>
        isAuthenticated ? this.auth.accessToken$.pipe(take(1)) : of(undefined),
      ),
      switchMap((token) => {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        });
        return this.http.post<{ delivered: boolean }>(
          `${this.serverUrl}/error-report`,
          payload,
          { headers },
        );
      }),
    );
  }

  getErrorsObservable() {
    return this.errorsSubject.asObservable();
  }

  reportError(error: HttpErrorResponse | ClientError): void {
    const clientError =
      error instanceof HttpErrorResponse ? this.parseHttpError(error) : error;

    if (!clientError.id) {
      clientError.id = `error-${++this.errorIdCounter}-${Date.now()}`;
    }

    const currentErrors = this.errorsSubject.value;

    const isDuplicate = currentErrors.some((existingError) =>
      this.areErrorsEquivalent(existingError, clientError),
    );

    if (!isDuplicate) {
      const updatedErrors = [clientError, ...currentErrors].slice(
        0,
        this.MAX_ERRORS,
      );
      this.errorsSubject.next(updatedErrors);
      this.rumService.recordClientError(clientError);
    }
  }

  private areErrorsEquivalent(
    error1: ClientError,
    error2: ClientError,
  ): boolean {
    return (
      error1.message === error2.message &&
      error1.status === error2.status &&
      error1.statusText === error2.statusText &&
      error1.url === error2.url &&
      error1.error?.code === error2.error?.code &&
      error1.error?.message === error2.error?.message &&
      JSON.stringify(error1.error?.details) ===
        JSON.stringify(error2.error?.details)
    );
  }

  dismissError(errorId: string): void {
    const currentErrors = this.errorsSubject.value;
    const updatedErrors = currentErrors.filter((e) => e.id !== errorId);
    this.errorsSubject.next(updatedErrors);
  }

  clearAllErrors(): void {
    this.errorsSubject.next([]);
  }

  private parseHttpError(httpError: HttpErrorResponse): ClientError {
    const clientError: ClientError = {
      id: `error-${++this.errorIdCounter}-${Date.now()}`,
      message: httpError.message,
      status: httpError.status,
      statusText: httpError.statusText,
      url: httpError.url,
    };

    if (httpError.error && typeof httpError.error === 'object') {
      const errorBody = httpError.error as any;

      if (errorBody.error) {
        clientError.error = {
          code: errorBody.error.code || 'UNKNOWN_ERROR',
          message: errorBody.error.message || httpError.statusText,
          details: errorBody.error.details,
          stack: errorBody.error.stack,
        };
      }

      if (errorBody.meta) {
        clientError.meta = {
          requestId: errorBody.meta.requestId,
          timestamp: errorBody.meta.timestamp,
        };
      }
    }

    return clientError;
  }
}
