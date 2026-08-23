import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  Subject,
  catchError,
  finalize,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { UploadService } from '@pdz/core/services/upload.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { HostedImageComponent } from '@pdz/shared/images/hosted-image/hosted-image.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  FilePreviewData,
  FileUploadPreviewComponent,
} from '../file-upload-preview/file-upload-preview.component';
@Component({
  selector: 'pdz-upload-image',
  imports: [
    HostedImageComponent,
    IconComponent,
    ButtonComponent,
  ],
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss'],
})
export class UploadImageComponent implements OnDestroy {
  private uploadService = inject(UploadService);
  private dialogs = inject(DialogService);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadMessage = '';
  uploadError = false;
  uploadedFileKey: string | null = null;
  confirmed: boolean = false;

  // Security constants (matches server)
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private destroy$ = new Subject<void>();

  openFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];

      // Client-side validation
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.uploadMessage = validation.error || 'Invalid file';
        this.uploadError = true;
        element.value = '';
        return;
      }

      this.selectedFile = file;
      this.uploadMessage = '';
      this.uploadError = false;
      this.uploadProgress = 0;
      this.uploadedFileKey = null;
      this.confirmed = false;
      void this.confirmUpload(this.selectedFile);
    } else {
      this.selectedFile = null;
    }

    element.value = '';
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${this.ALLOWED_TYPES.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds maximum (${this.MAX_FILE_SIZE / 1024 / 1024}MB)`,
      };
    }

    // Check file name
    if (
      file.name.includes('..') ||
      file.name.includes('/') ||
      file.name.includes('\\')
    ) {
      return { valid: false, error: 'Invalid file name' };
    }

    return { valid: true };
  }

  private async confirmUpload(file: File): Promise<void> {
    const confirmed = await this.dialogs.open<
      FileUploadPreviewComponent,
      boolean,
      FilePreviewData
    >(FileUploadPreviewComponent, {
      heading: 'Confirm Upload',
      size: 'sm',
      data: { file },
    }).closed;

    if (confirmed !== true) {
      this.cancelUpload();
      return;
    }

    if (!this.selectedFile) {
      this.cancelUpload();
      this.uploadMessage = 'Error: File selection lost. Please try again.';
      this.uploadError = true;
      return;
    }

    this.startUpload();
  }

  startUpload(): void {
    if (!this.selectedFile) {
      this.uploadMessage =
        'No file selected for upload. Please choose a file first.';
      this.uploadError = true;
      this.isUploading = false;
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = 'Requesting upload URL...';
    this.uploadError = false;
    this.uploadedFileKey = null;
    this.confirmed = false;
    const file = this.selectedFile;
    this.uploadService
      .getPresignedUploadUrl(file.name, file.type, 'league-logos')
      .pipe(
        tap((response) =>
          console.log('Received pre-signed URL response:', response),
        ),
        switchMap((response) => {
          if (!response || !response.url)
            throw new Error('Failed to get pre-signed URL from server.');
          this.uploadMessage = 'Uploading file to S3...';
          this.uploadedFileKey = response.key;
          return this.uploadService.uploadToS3(response.url, file);
        }),
        tap((s3Response) => {
          if (
            s3Response.type === HttpEventType.UploadProgress &&
            s3Response.total
          ) {
            this.uploadProgress = Math.round(
              (100 * s3Response.loaded) / s3Response.total,
            );
          } else if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && this.uploadedFileKey) {
              this.uploadProgress = 100;
              this.uploadMessage = 'Upload successful!';
              this.uploadError = false;
              this.confirmed = true;
              console.log('S3 Upload Response Status:', s3Response.status);
            } else if (!s3Response.ok) {
              throw new Error(
                `S3 upload failed with status: ${s3Response.status}`,
              );
            }
          }
        }),
        catchError((error) => {
          console.error('Upload process error:', error);
          const message =
            error?.error?.message || error?.message || 'Unknown error';
          this.uploadMessage = `Upload failed: ${message}`;
          this.uploadError = true;
          this.uploadProgress = 0;
          return throwError(() => error);
        }),
        finalize(() => {
          this.isUploading = false;
          if (this.uploadError && this.uploadProgress < 100) {
            this.uploadProgress = 0;
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  cancelUpload(): void {
    this.resetUploadState();
  }

  resetUploadState(): void {
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadMessage = '';
    this.uploadError = false;
    this.uploadedFileKey = null;
    this.confirmed = false;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
