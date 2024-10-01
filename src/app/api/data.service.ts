import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  cache: {
    formats?: string[];
    rulesets?: string[];
  } = {};

  getFormats(): Observable<string[]> {
    return this.apiService.get('data/formats', false);
  }

  getRulesets(): Observable<string[]> {
    return this.apiService.get('data/rulesets', false);
  }

  advancesearch(query: string[], ruleset?: string, format?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.get('data/advancesearch', false, params);
  }
}
