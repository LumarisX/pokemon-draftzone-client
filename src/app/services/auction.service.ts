import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuctionService {
  private socket: Socket;

  private allAuctionsSubject = new Subject<any>();
  public allAuctions$: Observable<any> = this.allAuctionsSubject.asObservable();

  private auctionStateSubject = new Subject<any>();
  public auctionState$: Observable<any> =
    this.auctionStateSubject.asObservable();

  private auctionEndedSubject = new Subject<any>();
  public auctionEnded$: Observable<any> =
    this.auctionEndedSubject.asObservable();

  private auctionErrorSubject = new Subject<any>();
  public auctionError$: Observable<any> =
    this.auctionErrorSubject.asObservable();

  constructor() {
    this.socket = io(environment.apiUrl);

    this.socket.on('allAuctions', (auctions) =>
      this.allAuctionsSubject.next(auctions),
    );
    this.socket.on('auctionUpdate', (state) =>
      this.auctionStateSubject.next(state),
    );
    this.socket.on('auctionEnded', (result) =>
      this.auctionEndedSubject.next(result),
    );
    this.socket.on('auctionError', (error) =>
      this.auctionErrorSubject.next(error),
    );
  }

  joinAuction(leagueId: string) {
    if (leagueId) {
      this.socket.emit('joinAuction', leagueId);
    }
  }

  placeBid(leagueId: string, itemId: string, bidAmount: number) {
    if (leagueId && itemId && bidAmount > 0) {
      this.socket.emit('placeBid', { leagueId, itemId, bidAmount });
    }
  }
}
