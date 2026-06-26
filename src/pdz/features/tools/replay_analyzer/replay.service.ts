import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import {
  ReplayAnalysis,
  ReplayWarning,
} from '@pdz/features/tools/replay_analyzer/replay.interface';
import {
  ReplayAnalysis as ReplayAnalysisV2,
  ReplayWarning as ReplayWarningV2,
} from '@pdz/features/tools/replay_analyzer-new/replay.interface';
@Injectable({
  providedIn: 'root',
})
export class ReplayService {
  private apiService = inject(ApiService);

  analyzeReplay(replayURI: string) {
    return this.apiService.get<{
      analysis: ReplayAnalysis;
      warnings: ReplayWarning[];
    }>(`replay/analyze`, {
      params: { url: replayURI.trim() },
    });
  }

  analyzeReplayV2(replayURI: string) {
    return this.apiService.get<{
      analysis: ReplayAnalysisV2;
      warnings: ReplayWarningV2[];
    }>(`replay/analyze/v2`, {
      params: { url: replayURI.trim() },
    });
  }
}
