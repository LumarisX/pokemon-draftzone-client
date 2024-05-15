import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

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
}
