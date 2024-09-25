import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ErrorService } from '../error/error.service';
@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private serverUrl = `ws://${environment.apiUrl}`;
  constructor(private errorService: ErrorService) {}

  connect(
    urlpath: string,
    onmessage: ((ev: MessageEvent) => any) | null = null
  ) {
    const socket = new WebSocket(this.serverUrl + '/' + urlpath);

    socket.onmessage = onmessage;

    socket.onerror = () => {
      this.errorService.reportError({
        message: 'Websocket experienced an error',
      });
      socket.close();
    };

    // socket.onclose = () => {
    //     this.reconnect()
    // }
  }

  private reconnect() {
    let retries = 0;
    const maxRetries = 3;
    const reconnectInterval = 5000;
    if (retries < maxRetries) {
      retries++;
      setTimeout(() => {
        console.log(`Reconnection attempt: #${retries}`);
        this.connect('Reconnected?');
      }, reconnectInterval);
    } else {
      console.log('Maximum reconnection amount reached');
    }
  }
}
