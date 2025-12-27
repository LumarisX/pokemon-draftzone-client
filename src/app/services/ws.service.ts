import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, throwError, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { filter, map, catchError } from 'rxjs/operators';

// Define JSON-RPC interfaces for client-side
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: Socket;
  private pendingRequests = new Map<
    number,
    {
      resolve: (response: JsonRpcResponse) => void;
      reject: (error: any) => void;
      timer: any;
    }
  >();
  private serverEvents$ = new Subject<{ event: string; data: any }>();
  private serverUrl = `${environment.tls ? 'wss' : 'ws'}://${environment.apiUrl}`;
  private idCounter = 0;
  private readonly requestTimeoutMs = 10000;

  constructor() {}

  connect(urlPath: string): Observable<any> {
    if (!this.socket$ || !this.socket$.connected) {
      this.socket$ = io(this.serverUrl, { path: '/' + urlPath + '/' });
      this.socket$.on(
        'message',
        (message: JsonRpcResponse | { event: string; data: any }) => {
          this.handleMessage(message);
        },
      );
      this.socket$.on('connect_error', (error: Error) =>
        console.error('WebSocket Connection Error:', error),
      );
      this.socket$.on('disconnect', (reason: Socket.DisconnectReason) => {
        console.warn('WebSocket Disconnected:', reason);
        this.clearPendingRequests('WebSocket disconnected');
      });
      this.socket$.on('connect', () => console.log('WebSocket Connected.'));
    }
    return new Observable((observer) => {
      this.socket$?.on('connect', () => observer.next(this.socket$));
      this.socket$?.on('disconnect', () => observer.complete());
    });
  }

  sendMessage<T>(method: string, params: any = {}): Observable<T> {
    const id = this.idCounter++;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: id,
    };

    return from(
      new Promise<JsonRpcResponse>((resolve, reject) => {
        const timerId = setTimeout(() => {
          this.pendingRequests.delete(id);
          reject(new Error('Timeout has occurred'));
        }, this.requestTimeoutMs);

        this.pendingRequests.set(id, { resolve, reject, timer: timerId });
        this.socket$?.emit('message', request);
      }),
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message || 'Unknown server error');
        }
        return response.result as T;
      }),
      catchError((err) => {
        console.error(`Request ${method} (ID: ${id}) failed:`, err);
        return throwError(
          () => new Error(`WebSocket request failed: ${err.message || err}`),
        );
      }),
    );
  }

  private handleMessage(
    message: JsonRpcResponse | { event: string; data: any },
  ) {
    if ('id' in message && message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);

        if (message.jsonrpc === '2.0') {
          if (message.error) {
            pending.reject(new Error(message.error.message || 'Server error'));
          } else {
            pending.resolve(message);
          }
        } else {
          pending.reject(new Error('Received malformed JSON-RPC response.'));
        }
      } else {
        console.warn(
          `Received response for unknown or already handled request ID: ${message.id}`,
        );
      }
    } else if ('event' in message && message.event) {
      this.serverEvents$.next({ event: message.event, data: message.data });
    } else {
      console.warn('Received unhandled WebSocket message:', message);
    }
  }

  on<T>(event: string): Observable<T> {
    return this.serverEvents$.pipe(
      filter((e) => e.event === event),
      map((e) => e.data as T),
    );
  }

  private clearPendingRequests(reason: string): void {
    this.pendingRequests.forEach(({ reject, timer }) => {
      clearTimeout(timer);
      reject(new Error(reason));
    });
    this.pendingRequests.clear();
  }

  close() {
    if (this.socket$) {
      this.clearPendingRequests('Connection closed');
      this.socket$.disconnect();
    }
  }
}
