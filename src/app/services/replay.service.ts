import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  ReplayAnalysis,
  ReplayWarning,
} from '../tools/replay_analyzer/replay.interface';

@Injectable({
  providedIn: 'root',
})
export class ReplayService {
  private apiService = inject(ApiService);

  analyzeReplay(replayURI: string) {
    return this.apiService.get<{
      analysis: ReplayAnalysis;
      warnings: ReplayWarning[];
    }>(`replay/analyze/${encodeURIComponent(replayURI.trim())}`, false);
  }
}
