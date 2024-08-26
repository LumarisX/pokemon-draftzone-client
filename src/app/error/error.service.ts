import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private errorSubject = new Subject<HttpErrorResponse>();

  getErrorObservable() {
    return this.errorSubject.asObservable();
  }

  reportError(error: HttpErrorResponse) {
    this.errorSubject.next(error);
  }
}
