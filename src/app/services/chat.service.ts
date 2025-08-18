import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket;
  private messageSubject = new Subject<any>();
  public messages$: Observable<any> = this.messageSubject.asObservable();

  constructor() {
    this.socket = io(environment.apiUrl);

    this.socket.on('newMessage', (message) => {
      console.log(message);
      this.messageSubject.next(message);
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server!');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server.');
    });
  }

  joinRoom(leagueId: string) {
    if (this.socket && leagueId) {
      this.socket.emit('joinRoom', leagueId);
    }
  }

  sendMessage(
    leagueId: string,
    message: string,
    username: string = 'Anonymous',
  ) {
    if (this.socket && message) {
      const messageData = {
        leagueId: leagueId,
        text: message,
        user: username,
        timestamp: new Date(),
      };
      this.socket.emit('sendMessage', messageData);
    }
  }
}
