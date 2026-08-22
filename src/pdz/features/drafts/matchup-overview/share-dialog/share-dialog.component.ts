import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';

import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DIALOG_DATA } from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { MatchupData } from '../matchup-interface';

export interface ShareDialogData {
  shareUrl: string;
  matchupData: MatchupData;
}

const COPIED_RESET_MS = 1000;

@Component({
  selector: 'pdz-share-dialog',
  imports: [ButtonComponent, SpriteComponent, IconComponent],
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareDialogComponent implements OnDestroy {
  protected readonly data = inject<ShareDialogData>(DIALOG_DATA);

  protected readonly copied = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.shareUrl);
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error);
      return;
    }
    this.copied.set(true);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), COPIED_RESET_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.resetTimer);
  }
}
