import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

export interface FilePreviewData {
  file: File;
}

@Component({
  selector: 'pdz-file-upload-preview',
  imports: [IconComponent, ButtonComponent],
  templateUrl: './file-upload-preview.component.html',
  styleUrls: ['./file-upload-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadPreviewComponent implements OnDestroy {
  protected readonly ref = inject(DialogRef) as DialogRef<boolean>;
  protected readonly data = inject<FilePreviewData>(DIALOG_DATA);

  protected readonly file = this.data?.file ?? null;
  protected readonly isImage = this.file?.type.startsWith('image/') ?? false;
  protected readonly previewUrl = signal<string | null>(null);

  private objectUrl?: string;

  constructor() {
    if (this.isImage && this.file) {
      this.objectUrl = URL.createObjectURL(this.file);
      this.previewUrl.set(this.objectUrl);
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  protected formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
