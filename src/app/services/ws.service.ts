import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: Socket;
  private pendingRequests = new Map<number, Subject<any>>();
  private serverEvents$ = new Subject<{event: string, data: any}>();
  private serverUrl = `ws://${environment.apiUrl}`;
  private idCounter = 0;

  constructor() {}

  connect(urlPath: string): Observable<any> {
    if (!this.socket$ || !this.socket$.connected) {
      this.socket$ = io(this.serverUrl, { path: '/' + urlPath + '/' });
      this.socket$.on('message', (message) => this.handleMessage(message));
      this.socket$.on('connect_error', (error) => console.error('WebSocket Error:', error));
    }
    return new Observable(observer => {
      this.socket$?.on('connect', () => observer.next(this.socket$));
      this.socket$?.on('disconnect', () => observer.complete());
    });
  }

  sendMessage(event: string, data: any = {}): Observable<any> {
    const id = this.idCounter++;
    const responseSubject = new Subject<any>();
    const request = { event, id, ...data };

    this.pendingRequests.set(id, responseSubject);
    this.socket$?.emit('message', request);

    return responseSubject.asObservable();
  }

  private handleMessage(message: any) {
    const id = message.id;
    const subject = this.pendingRequests.get(id);

    if (subject) {
      subject.next(message.result);
      this.pendingRequests.delete(id);
    } else if (message.event) {
      this.serverEvents$.next({ event: message.event, data: message.data });
    } else {
      console.error('No matching request for id:', id);
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
