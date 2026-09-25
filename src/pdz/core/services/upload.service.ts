import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export type PresignedUpload = {
  url: string;
  fields: Record<string, string>;
  key: string;
  expiresIn: number;
  maxBytes: number;
};

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder: string,
  ): Observable<PresignedUpload> {
    return this.apiService.post('uploads/presigned-url', {
      folder,
      fileName,
      contentType,
    });
  }

  uploadToS3(
    presigned: PresignedUpload,
    file: File,
  ): Observable<HttpEvent<unknown>> {
    if (file.size > presigned.maxBytes)
      return throwError(
        () =>
          new Error(
            `File size exceeds maximum (${presigned.maxBytes / 1024 / 1024}MB)`,
          ),
      );

    const form = new FormData();
    for (const [name, value] of Object.entries(presigned.fields))
      form.append(name, value);
    form.append('file', file);

    return this.http.post(presigned.url, form, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
