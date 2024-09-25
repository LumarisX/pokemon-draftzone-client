import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ClientError = {
  message: string;
  status?: number;
  statusText?: string;
  url?: string | null;
  error?: {
    code: string;
  };
};

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private errorSubject = new Subject<ClientError>();

  getErrorObservable() {
    return this.errorSubject.asObservable();
  }

  reportError(error: ClientError) {
    this.errorSubject.next(error);
  }
}
