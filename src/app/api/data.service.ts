import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private apiService: ApiService) {}

  getFormats() {
    return this.apiService.get('data/formats');
  }

  getRulesets() {
    return this.apiService.get('data/rulesets');
  }
}
