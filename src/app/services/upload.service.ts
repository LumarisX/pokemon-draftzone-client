import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  getUploadLink(
    filename: string,
    contentType: string,
  ): Observable<{ url: string; key: string }> {
    return this.apiService.get(`file/league-upload`, true, {
      filename,
      contentType,
    });
  }
  uploadToS3(presignedUrl: string, file: File) {
    const headers = new HttpHeaders({ 'Content-Type': file.type });
    console.log(
      `Uploading to S3 URL: ${presignedUrl.split('?')[0]}... with Content-Type: ${file.type}`,
    );

    return this.http.put(presignedUrl, file, {
      headers: headers,
      reportProgress: true,
      observe: 'events',
    });
  }

  confirmUploadWithBackend(
    fileKey: string,
    fileSize: number,
    fileType: string,
  ) {
    return this.apiService.post('file/confirm-upload', true, {
      fileKey,
      fileSize,
      fileType,
    });
  }
}
