import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private pendingRequests = new Map<number, Subject<any>>();
  private serverUrl = `ws://${environment.apiUrl}`;
  constructor() {}

  connect(urlPath: string): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket(this.serverUrl + '/' + urlPath);
      this.socket$.subscribe({
        next: (message) => this.handleMessage(message),
        error: (error) => console.error('WebSocket Error:', error),
      });
    }
    return this.socket$;
  }

  sendMessage(request: any): Observable<any> {
    const id = request.id;
    const responseSubject = new Subject<any>();

    this.pendingRequests.set(id, responseSubject);
    this.socket$?.next(request);

    return responseSubject.asObservable();
  }

  private handleMessage(message: any) {
    const id = message.id;
    const subject = this.pendingRequests.get(id);

    if (subject) {
      subject.next(message.result);
      this.pendingRequests.delete(id);
    } else {
      console.error('No matching request for id:', id);
    }
  }

  close() {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
