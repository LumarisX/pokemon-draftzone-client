import { OverlayRef } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InjectionToken } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
export const OVERLAY_REF_TOKEN = new InjectionToken<OverlayRef>('OverlayRef');
export const FILE_PREVIEW_DATA_TOKEN = new InjectionToken<FilePreviewData>(
  'FilePreviewData',
);
export interface FilePreviewData {
  file: File;
}

@Component({
  selector: 'pdz-file-upload-preview',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload-preview.component.html',
  styleUrls: ['./file-upload-preview.component.scss'], // Changed styleUrl to styleUrls
})
export class FileUploadPreviewComponent implements OnInit {
  overlayRef = inject<OverlayRef>(OVERLAY_REF_TOKEN);
  data = inject<FilePreviewData>(FILE_PREVIEW_DATA_TOKEN);
  private sanitizer = inject(DomSanitizer);


  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  previewUrl: SafeUrl | null = null;
  isImage = false;
  file: File | null = null;

  ngOnInit(): void {
    this.file = this.data.file;
    this.isImage = this.file?.type.startsWith('image/') ?? false;

    if (this.isImage && this.file) {
      this.generatePreview(this.file);
    }
  }

  generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(
        e.target?.result as string,
      );
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      this.previewUrl = null; // Handle error case
    };
    reader.readAsDataURL(file);
  }

  onConfirm(): void {
    this.confirm.emit();
    // Overlay will be closed by the parent component
  }

  onCancel(): void {
    this.cancel.emit();
    this.overlayRef.dispose(); // Close overlay on cancel
  }

  // Helper to format bytes
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
