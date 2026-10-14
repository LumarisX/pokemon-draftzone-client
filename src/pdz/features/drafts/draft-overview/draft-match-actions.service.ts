import { inject, Injectable } from '@angular/core';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import {
  MatchTimeDialogComponent,
  MatchTimeDialogData,
  MatchTimeDialogResult,
} from '@pdz/shared/time/match-time-dialog/match-time-dialog.component';
import { firstValueFrom } from 'rxjs';
import { DraftService } from './draft.service';

export type DraftMatchRef = {
  id: string;
  stage: string;
  opponentName: string;
  scheduledDate?: string | null;
  opponentTimezone?: string | null;
};

@Injectable({ providedIn: 'root' })
export class DraftMatchActionsService {
  private readonly drafts = inject(DraftService);
  private readonly dialogs = inject(DialogService);
  private readonly toasts = inject(ToastService);

  async setMatchTime(
    teamId: string,
    match: DraftMatchRef,
  ): Promise<MatchTimeDialogResult | null> {
    const result = await this.dialogs.open<
      MatchTimeDialogComponent,
      MatchTimeDialogResult,
      MatchTimeDialogData
    >(MatchTimeDialogComponent, {
      heading: match.scheduledDate ? 'Edit Match Time' : 'Set Match Time',
      subheading: `${match.stage} vs ${match.opponentName}`,
      size: 'lg',
      data: {
        opponentName: match.opponentName,
        scheduledDate: match.scheduledDate,
        opponentTimezone: match.opponentTimezone,
      },
    }).closed;
    if (!result) return null;

    try {
      await firstValueFrom(
        this.drafts.updateMatchupSchedule(match.id, teamId, result),
      );
      return result;
    } catch {
      this.toasts.error('Could not save the match time.');
      return null;
    }
  }

  async remove(teamId: string, match: DraftMatchRef): Promise<boolean> {
    const confirmed = await this.dialogs.confirm('Delete matchup', {
      message: `Delete ${match.stage} vs ${match.opponentName}? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return false;

    try {
      await firstValueFrom(this.drafts.deleteMatchup(match.id, teamId));
      return true;
    } catch {
      this.toasts.error('Could not delete that matchup.');
      return false;
    }
  }
}
