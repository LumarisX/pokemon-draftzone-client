import { Injectable, inject } from '@angular/core';
import { ApiService } from '@pdz/core/services/api.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@pdz/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);

  private serverUrl = `${environment.tls ? 'https' : 'http'}://${
    environment.apiUrl
  }`;

  //Currently Unused
  getUploadLink(
    fileName: string,
    contentType: string,
  ): Observable<{ url: string; key: string }> {
    return this.apiService.get(`file/league-upload`, {
      authenticated: true,
      params: {
        fileName,
        contentType,
      },
    });
  }

  getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    folder: string,
  ): Observable<{ url: string; key: string; expiresIn: number }> {
    return this.apiService.post(
      'uploads/presigned-url',
      { folder, fileName, contentType },
      { authenticated: true },
    );
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

  //Currently Unused
  confirmUploadWithBackend(
    fileKey: string,
    fileSize: number,
    fileType: string,
  ) {
    return this.apiService.post(
      'file/confirm-upload',
      {
        fileKey,
        fileSize,
        fileType,
      },
      { authenticated: true },
    );
  }
}
