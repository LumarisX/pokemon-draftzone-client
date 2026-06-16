import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { MatchupData } from '../matchup-interface';

export interface ShareDialogData {
  shareUrl: string;
  matchupData: MatchupData;
}

export type ShareDialogResult = void;

@Component({
  selector: 'pdz-share-dialog',
  imports: [MatDialogModule, SpriteComponent, IconComponent],
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
})
export class ShareDialogComponent {
  dialogRef =
    inject<MatDialogRef<ShareDialogComponent, ShareDialogResult>>(MatDialogRef);
  data: ShareDialogData = inject<ShareDialogData>(MAT_DIALOG_DATA);

  copied = false;

  copyToClipboard(): void {
    navigator.clipboard
      .writeText(this.data.shareUrl)
      .then(() => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 1000);
      })
      .catch((error) =>
        console.error('Failed to copy URL to clipboard:', error),
      );
  }
}
