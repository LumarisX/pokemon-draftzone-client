import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { filter, map, takeUntil, timeout, catchError } from 'rxjs/operators';

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
  id?: number; // id is optional for notifications or errors without a request id
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: Socket;
  private pendingRequests = new Map<number, Subject<JsonRpcResponse>>();
  private serverEvents$ = new Subject<{ event: string; data: any }>();
  private serverUrl = `${environment.tls ? 'wss' : 'ws'}://${environment.apiUrl}`;
  private idCounter = 0;
  private readonly requestTimeoutMs = 10000; // 10 seconds timeout for requests

  constructor() {}

  connect(urlPath: string): Observable<any> {
    if (!this.socket$ || !this.socket$.connected) {
      this.socket$ = io(this.serverUrl, { path: '/' + urlPath + '/' });
      this.socket$.on('message', (message: JsonRpcResponse | { event: string; data: any }) =>
        this.handleMessage(message)
      );
      this.socket$.on('connect_error', (error: Error) =>
        console.error('WebSocket Connection Error:', error)
      );
      this.socket$.on('disconnect', (reason: Socket.DisconnectReason) =>
        console.warn('WebSocket Disconnected:', reason)
      );
      this.socket$.on('connect', () => console.log('WebSocket Connected.'));
    }
    return new Observable((observer) => {
      this.socket$?.on('connect', () => observer.next(this.socket$));
      this.socket$?.on('disconnect', () => observer.complete());
    });
  }

  sendMessage<T>(method: string, params: any = {}): Observable<T> {
    const id = this.idCounter++;
    const responseSubject = new Subject<JsonRpcResponse>();
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: id,
    };

    this.pendingRequests.set(id, responseSubject);
    this.socket$?.emit('message', request);

    return responseSubject.asObservable().pipe(
      timeout(this.requestTimeoutMs), // Apply timeout to the observable
      takeUntil(timer(this.requestTimeoutMs + 100)), // Ensure cleanup if timeout occurs
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message || 'Unknown server error');
        }
        return response.result as T;
      }),
      catchError((err) => {
        this.pendingRequests.delete(id); // Clean up pending request on error
        console.error(`Request ${method} (ID: ${id}) failed or timed out:`, err);
        return throwError(() => new Error(`WebSocket request failed: ${err.message || err}`));
      })
    );
  }

  private handleMessage(message: JsonRpcResponse | { event: string; data: any }) {
    // Check if it's a JSON-RPC response to a pending request
    if ('id' in message && message.id !== undefined && this.pendingRequests.has(message.id)) {
      const subject = this.pendingRequests.get(message.id);
      if (subject) {
        if (message.jsonrpc === '2.0') {
          subject.next(message);
        } else {
          // If it has an ID but not jsonrpc: '2.0', it's an unexpected format
          subject.error(new Error('Received malformed JSON-RPC response.'));
        }
        this.pendingRequests.delete(message.id);
      }
    }
    // Check if it's a server-pushed event (no id, but has an event property)
    else if ('event' in message && message.event) {
      this.serverEvents$.next({ event: message.event, data: message.data });
    } else {
      console.warn('Received unhandled WebSocket message:', message);
    }
  }

  on<T>(event: string): Observable<T> {
    return this.serverEvents$.pipe(
      filter((e) => e.event === event),
      map((e) => e.data as T)
    );
  }

  close() {
    if (this.socket$) {
      this.socket$.disconnect();
    }
  }
}
