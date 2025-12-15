import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ReplayData } from '../tools/replay_analyzer/replay.interface';

@Injectable({
  providedIn: 'root',
})
export class ReplayService {
  private apiService = inject(ApiService);

  analyzeReplay(replayURI: string) {
    return this.apiService.get<ReplayData>(
      `replay/analyze/${encodeURIComponent(replayURI.trim())}`,
      false,
    );
  }
}
