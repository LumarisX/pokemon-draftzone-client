import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { AuthModule } from '@auth0/auth0-angular';

describe('ApiService', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://localhost',
      },
      writable: true,
    });

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        AuthModule.forRoot({
          domain: 'dev-wspjxi5f6mjqsjea.us.auth0.com',
          clientId: 'nAyvHSOL1PbsFZfodzgIjRgYBUA1M1DH',
          useRefreshTokens: false, // Disable refresh tokens for testing
          cacheLocation: 'memory', // Use memory storage for tests
          authorizationParams: {
            redirect_uri: 'https://localhost', // Match mocked origin
            audience: 'https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/',
          },
        }),
      ],
      providers: [ApiService],
    });

    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('creates a service', () => {
    expect(apiService).toBeTruthy();
  });
});
