import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap, tap, throwError } from 'rxjs';
import { UploadService } from '../../api/upload.service';

@Component({
  selector: 'app-league',
  imports: [RouterLink],
  templateUrl: './league.component.html',
  styleUrl: './league.component.scss',
})
export class LeagueComponent {
  constructor(private uploadService: UploadService) {}

  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadMessage = '';
  uploadError = false;
  uploadedFileKey: string | null = null;
  imageUrl?: string;
  confirmed: boolean = false;

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.uploadMessage = '';
      this.uploadError = false;
      this.uploadProgress = 0;
      this.uploadedFileKey = null;
    } else {
      this.selectedFile = null;
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first.';
      this.uploadError = true;
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = 'Requesting upload URL...';
    this.uploadError = false;
    this.uploadedFileKey = null;
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
          this.imageUrl = response.url.split('?')[0];
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
              this.uploadMessage =
                'Upload successful! Confirming with backend...';
              console.log('S3 Upload Response Status:', s3Response.status);
              console.log('S3 ETag:', s3Response.headers.get('ETag'));
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
          this.uploadMessage = `Upload failed: ${error.message || 'Unknown error'}`;
          this.uploadError = true;
          return throwError(() => error);
        }),
        finalize(() => {
          this.isUploading = false;
          this.selectedFile = null;
        }),
      )
      .subscribe((confirmationResponse) => {
        if (confirmationResponse && confirmationResponse.message) {
          console.log('Backend confirmation response:', confirmationResponse);
          this.uploadMessage = confirmationResponse.message;
          this.uploadError = false;
          this.confirmed = true;
        }
      });
  }
}
