import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { rule } from 'postcss';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  getFormats() {
    return this.apiService.getUnauth('data/formats');
  }

  getRulesets() {
    return this.apiService.getUnauth('data/rulesets');
  }

  advancesearch(query: string[], ruleset?: string) {
    let encodedQuery = encodeURIComponent(query.join(''));
    let params: { [key: string]: string } = { query: encodedQuery };
    if (ruleset) params['ruleset'] = ruleset;
    return this.apiService.getUnauth('data/advancesearch', params);
  }
}
