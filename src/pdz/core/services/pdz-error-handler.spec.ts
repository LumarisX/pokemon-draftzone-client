import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RumService } from '@pdz/core/services/rum.service';
import { ErrorService } from '@pdz/layout/error/error.service';
import { ApiError } from './api-error';
import { ApiService } from './api.service';
import { PdzErrorHandler } from './pdz-error-handler';

describe('error reporting', () => {
  let errors: ErrorService;
  let rum: { recordClientError: jest.Mock };
  let consoleError: jest.SpyInstance;

  const conflict = new HttpErrorResponse({
    status: 409,
    statusText: 'Conflict',
    url: 'http://api/leagues/pdbl/tournaments/s3/bracket/current-round',
    error: {
      error: {
        code: 'TRN-005',
        message: 'This tournament is completed and can no longer be changed',
      },
    },
  });

  beforeEach(() => {
    rum = { recordClientError: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PdzErrorHandler,
        { provide: RumService, useValue: rum },
      ],
    });
    errors = TestBed.inject(ErrorService);
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  describe('PdzErrorHandler', () => {
    it('shows an uncaught HTTP error in the error panel', () => {
      TestBed.inject(PdzErrorHandler).handleError(conflict);

      expect(errors.errors()).toHaveLength(1);
      expect(errors.errors()[0].error?.code).toBe('TRN-005');
    });

    it('unwraps an unhandled promise rejection', () => {
      const wrapped = Object.assign(new Error('Uncaught (in promise)'), {
        rejection: conflict,
      });

      TestBed.inject(PdzErrorHandler).handleError(wrapped);

      expect(errors.errors()).toHaveLength(1);
    });

    it('shows an uncaught ApiError with its code and details', () => {
      TestBed.inject(PdzErrorHandler).handleError(new ApiError(conflict));

      expect(errors.errors()).toHaveLength(1);
      expect(errors.errors()[0].error?.message).toBe(
        'This tournament is completed and can no longer be changed',
      );
    });

    it('leaves non-HTTP errors to the console', () => {
      TestBed.inject(PdzErrorHandler).handleError(new TypeError('boom'));

      expect(errors.errors()).toHaveLength(0);
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('ApiService', () => {
    let api: ApiService;
    let http: HttpTestingController;

    beforeEach(() => {
      api = TestBed.inject(ApiService);
      http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('records a failed request without showing it, so the caller can handle it', () => {
      let caught: unknown;
      api.patch('bracket/current-round', {}).subscribe({
        error: (err) => (caught = err),
      });

      http
        .expectOne((req) => req.url.endsWith('bracket/current-round'))
        .flush(conflict.error, { status: 409, statusText: 'Conflict' });

      expect(caught).toBeInstanceOf(ApiError);
      expect((caught as ApiError).status).toBe(409);
      expect((caught as ApiError).message).toBe(
        'This tournament is completed and can no longer be changed',
      );
      expect(rum.recordClientError).toHaveBeenCalledTimes(1);
      expect(errors.errors()).toHaveLength(0);
    });

    it('skips telemetry for suppressed statuses', () => {
      api
        .get('signup', { errorHandlingOptions: { suppressStatuses: [404] } })
        .subscribe({ error: () => {} });

      http
        .expectOne((req) => req.url.endsWith('signup'))
        .flush(null, { status: 404, statusText: 'Not Found' });

      expect(rum.recordClientError).not.toHaveBeenCalled();
    });

    it('records a shared GET once however many callers subscribe', () => {
      const request$ = api.get('league');
      request$.subscribe({ error: () => {} });
      request$.subscribe({ error: () => {} });

      http
        .expectOne((req) => req.url.endsWith('league'))
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(rum.recordClientError).toHaveBeenCalledTimes(1);
    });
  });
});
