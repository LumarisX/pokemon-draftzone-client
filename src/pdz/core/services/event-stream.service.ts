import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '@pdz/environments/environment';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  skip,
  switchMap,
  take,
} from 'rxjs/operators';

export const RETRY_BASE_MS = 1_000;
export const RETRY_MAX_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class EventStreamService {
  private auth = inject(AuthService);
  private serverUrl = `${environment.tls ? 'https' : 'http'}://${environment.apiUrl}`;
  private events$ = new Subject<{ event: string; data: unknown }>();
  private path: string | null = null;
  private connection?: AbortController;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private failures = 0;

  constructor() {
    this.auth.isAuthenticated$
      .pipe(
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.restart());
  }

  open(path: string): void {
    if (this.path === path) return;
    this.path = path;
    this.failures = 0;
    this.restart();
  }

  close(): void {
    this.path = null;
    this.stop();
  }

  on<T>(event: string): Observable<T> {
    return this.events$.pipe(
      filter((message) => message.event === event),
      map((message) => message.data as T),
    );
  }

  private restart(): void {
    this.stop();
    if (!this.path) return;
    const connection = new AbortController();
    this.connection = connection;
    void this.connect(this.path, connection.signal);
  }

  private stop(): void {
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.connection?.abort();
    this.connection = undefined;
  }

  private async connect(path: string, signal: AbortSignal): Promise<void> {
    const retry = await this.stream(path, signal).catch(() => true);
    if (!retry || signal.aborted) return;

    const delay = Math.min(RETRY_BASE_MS * 2 ** this.failures, RETRY_MAX_MS);
    this.failures++;
    this.retryTimer = setTimeout(() => {
      if (this.path === path) this.restart();
    }, delay);
  }

  private async stream(path: string, signal: AbortSignal): Promise<boolean> {
    const token = await this.token();
    if (signal.aborted) return false;

    const response = await fetch(`${this.serverUrl}/${path}`, {
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
      signal,
    });
    if (!response.ok || !response.body)
      return response.status === 429 || response.status >= 500;

    this.failures = 0;
    await this.read(response.body.getReader());
    return true;
  }

  private async read(
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        this.dispatch(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf('\n\n');
      }
    }
  }

  private dispatch(block: string): void {
    let event = 'message';
    const data: string[] = [];
    for (const rawLine of block.split('\n')) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') event = value;
      if (field === 'data') data.push(value);
    }
    if (!data.length) return;

    let payload: unknown;
    try {
      payload = JSON.parse(data.join('\n'));
    } catch {
      return;
    }
    this.events$.next({ event, data: payload });
  }

  private token(): Promise<string | undefined> {
    return firstValueFrom(
      this.auth.isAuthenticated$.pipe(
        take(1),
        switchMap((authenticated) =>
          authenticated ? this.auth.getAccessTokenSilently() : of(undefined),
        ),
        catchError(() => of(undefined)),
      ),
    );
  }
}
