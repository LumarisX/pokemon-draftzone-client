import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { Observable } from 'rxjs';
import { CalcRequest, CalcResponse } from './calculator.model';

@Injectable({ providedIn: 'root' })
export class CalculatorService {
  private api = inject(ApiService);

  calculate(request: CalcRequest): Observable<CalcResponse> {
    return this.api.post<CalcResponse>('calc', request);
  }

  rulesets(): Observable<[string, { name: string; id: string }[]][]> {
    return this.api.get<[string, { name: string; id: string }[]][]>([
      'calc',
      'rulesets',
    ]);
  }
}
