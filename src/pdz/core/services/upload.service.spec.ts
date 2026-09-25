import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { PresignedUpload, UploadService } from './upload.service';

describe('UploadService.uploadToS3', () => {
  let service: UploadService;
  let http: HttpTestingController;

  const presigned: PresignedUpload = {
    url: 'https://bucket.s3.amazonaws.com/',
    fields: {
      key: 'team-logos/abc-logo.png',
      'Content-Type': 'image/png',
      Policy: 'policy',
    },
    key: 'team-logos/abc-logo.png',
    expiresIn: 120,
    maxBytes: 1024,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: {} },
      ],
    });
    service = TestBed.inject(UploadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the signed fields first and the file last', () => {
    const file = new File(['png'], 'logo.png', { type: 'image/png' });

    service.uploadToS3(presigned, file).subscribe();

    const request = http.expectOne(presigned.url);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect([...body.keys()]).toEqual([
      'key',
      'Content-Type',
      'Policy',
      'file',
    ]);
    expect(body.get('key')).toBe('team-logos/abc-logo.png');
    expect(body.get('file')).toBeInstanceOf(File);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('refuses a file over the signed size limit without sending it', () => {
    const file = new File([new Uint8Array(2048)], 'big.png', {
      type: 'image/png',
    });
    let error: Error | undefined;

    service.uploadToS3(presigned, file).subscribe({
      error: (err) => (error = err),
    });

    expect(error?.message).toContain('exceeds maximum');
    http.expectNone(presigned.url);
  });
});
