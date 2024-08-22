import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { rule } from 'postcss';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  getFormats() {
    return this.apiService.get('data/formats', false);
  }

  getRulesets() {
    return this.apiService.get('data/rulesets', false);
  }

  advancesearch(query: string[], ruleset?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.get('data/advancesearch', false, params);
  }
}
