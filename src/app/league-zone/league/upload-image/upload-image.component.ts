import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  Subject,
  catchError,
  finalize,
  of,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { UploadService } from '../../../services/upload.service';
import { HostedImageComponent } from '../../../images/hosted-image/hosted-image.componet';
import {
  FILE_PREVIEW_DATA_TOKEN,
  FileUploadPreviewComponent,
  OVERLAY_REF_TOKEN,
} from '../file-upload-preview/file-upload-preview.component';
@Component({
  selector: 'pdz-upload-image',
  standalone: true,
  imports: [
    CommonModule,
    HostedImageComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss'],
})
export class UploadImageComponent implements OnDestroy {
  private uploadService = inject(UploadService);
  private overlay = inject(Overlay);
  private injector = inject(Injector);
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadMessage = '';
  uploadError = false;
  uploadedFileKey: string | null = null;
  confirmed: boolean = false;

  private overlayRef: OverlayRef | null = null;
  private destroy$ = new Subject<void>();

  openFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.uploadMessage = '';
      this.uploadError = false;
      this.uploadProgress = 0;
      this.uploadedFileKey = null;
      this.confirmed = false;
      this.openPreviewOverlay(this.selectedFile);
    } else {
      this.selectedFile = null;
    }

    element.value = '';
  }

  openPreviewOverlay(file: File): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }

    const overlayConfig = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    this.overlayRef = this.overlay.create(overlayConfig);

    const customInjector = Injector.create({
      providers: [
        { provide: OVERLAY_REF_TOKEN, useValue: this.overlayRef },
        { provide: FILE_PREVIEW_DATA_TOKEN, useValue: { file: file } },
      ],
      parent: this.injector,
    });

    const previewPortal = new ComponentPortal(
      FileUploadPreviewComponent,
      null,
      customInjector,
    );

    const componentRef = this.overlayRef.attach(previewPortal);

    this.overlayRef
      .backdropClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cancelUpload();
      });

    componentRef.instance.confirm
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.selectedFile) {
          this.overlayRef?.dispose();
          this.overlayRef = null;
          this.startUpload();
        } else {
          console.error('Error: File became null before upload confirmation.');
          this.cancelUpload();
          this.uploadMessage = 'Error: File selection lost. Please try again.';
          this.uploadError = true;
        }
      });

    componentRef.instance.cancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cancelUpload();
      });
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
      .getUploadLink(file.name, file.type)
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
        switchMap((s3Response) => {
          if (
            s3Response.type === HttpEventType.UploadProgress &&
            s3Response.total
          ) {
            this.uploadProgress = Math.round(
              (100 * s3Response.loaded) / s3Response.total,
            );
            return of(null);
          } else if (s3Response instanceof HttpResponse) {
            if (s3Response.ok && this.uploadedFileKey) {
              this.uploadProgress = 100;
              this.uploadMessage =
                'Upload successful! Confirming with backend...';
              console.log('S3 Upload Response Status:', s3Response.status);
              return this.uploadService.confirmUploadWithBackend(
                this.uploadedFileKey,
                file.size,
                file.type,
              );
            } else if (!s3Response.ok) {
              throw new Error(
                `S3 upload failed with status: ${s3Response.status}`,
              );
            }
          }
          return of(null);
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
      .subscribe((confirmationResponse) => {
        if (confirmationResponse) {
          console.log('Backend confirmation response:', confirmationResponse);
          this.uploadMessage =
            confirmationResponse.message || 'Backend confirmation received.';
          this.uploadError = false;
          this.confirmed = true;
        }
      });
  }

  cancelUpload(): void {
    this.resetUploadState();
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    console.log('Upload cancelled.');
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
    if (this.overlayRef) {
      this.overlayRef.dispose();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
