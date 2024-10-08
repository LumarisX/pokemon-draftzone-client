import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ReplayService {
  constructor(private apiService: ApiService) {}

  analyzeReplay(replayURI: string) {
    return this.apiService.get(
      `replay/analyze/${encodeURIComponent(replayURI.trim())}`,
      false
    );
  }
}
