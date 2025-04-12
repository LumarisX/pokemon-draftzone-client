import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal'; // No PortalInjector needed
import { CommonModule } from '@angular/common';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core'; // Added inject
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
import { UploadService } from '../../../api/upload.service';
import { HostedImageComponent } from '../../../images/hosted-image/hosted-image.componet';
import {
  FILE_PREVIEW_DATA_TOKEN,
  FileUploadPreviewComponent,
  OVERLAY_REF_TOKEN,
} from '../file-upload-preview/file-upload-preview.component'; // Adjust path as needed

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
  // Use inject function for cleaner dependency injection (optional but modern)
  private uploadService = inject(UploadService);
  private overlay = inject(Overlay);
  private injector = inject(Injector); // Injector needed for Injector.create

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
      // *** FIX: Only reset status/progress, not the selected file ***
      this.uploadMessage = '';
      this.uploadError = false;
      this.uploadProgress = 0;
      this.uploadedFileKey = null;
      this.confirmed = false;
      // Open the preview overlay
      this.openPreviewOverlay(this.selectedFile);
    } else {
      this.selectedFile = null; // Clear if no file selected
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

    // *** FIX: Use Injector.create instead of PortalInjector ***
    const customInjector = Injector.create({
      providers: [
        { provide: OVERLAY_REF_TOKEN, useValue: this.overlayRef },
        { provide: FILE_PREVIEW_DATA_TOKEN, useValue: { file: file } },
      ],
      parent: this.injector, // Use component's injector as parent
    });

    // Pass the custom injector when creating the portal
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
        // Check if file still exists before starting upload (should always be true here)
        if (this.selectedFile) {
          this.overlayRef?.dispose();
          this.overlayRef = null;
          this.startUpload();
        } else {
          console.error('Error: File became null before upload confirmation.');
          this.cancelUpload(); // Cancel if file mysteriously disappeared
          this.uploadMessage = 'Error: File selection lost. Please try again.';
          this.uploadError = true;
        }
      });

    componentRef.instance.cancel
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cancelUpload(); // Overlay is disposed in its own cancel method or here
      });
  }

  // No createInjector helper needed anymore

  startUpload(): void {
    // *** FIX: Double-check selectedFile is present ***
    if (!this.selectedFile) {
      this.uploadMessage =
        'No file selected for upload. Please choose a file first.';
      this.uploadError = true;
      this.isUploading = false; // Ensure uploading state is off
      return;
    }

    // Reset state *before* starting the actual upload process
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = 'Requesting upload URL...';
    this.uploadError = false;
    this.uploadedFileKey = null;
    this.confirmed = false;
    const file = this.selectedFile; // Keep reference

    // --- Rest of the upload logic remains the same ---
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
          // Check if error is an HttpErrorResponse for more details
          const message =
            error?.error?.message || error?.message || 'Unknown error';
          this.uploadMessage = `Upload failed: ${message}`;
          this.uploadError = true;
          this.uploadProgress = 0;
          return throwError(() => error);
        }),
        finalize(() => {
          this.isUploading = false;
          // Optionally reset progress if upload failed before completion
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
    this.resetUploadState(); // Full reset on cancel
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    console.log('Upload cancelled.');
  }

  // resetUploadState now correctly clears everything including the file
  resetUploadState(): void {
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.uploadMessage = '';
    this.uploadError = false;
    this.uploadedFileKey = null;
    this.confirmed = false;
    // Also clear the file input visually/programmatically if possible, though element.value='' in onFileSelected helps
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
