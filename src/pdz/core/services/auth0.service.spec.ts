import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { AccountDataService } from '@pdz/core/services/account-data.service';
import { AuthRecoveryService } from '@pdz/core/services/auth-recovery.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { of } from 'rxjs';

describe('AuthService.logout', () => {
  let auth0: {
    logout: jest.Mock;
    loginWithRedirect: jest.Mock;
    [member: string]: unknown;
  };
  let accountData: { clearForLogout: jest.Mock };

  beforeEach(() => {
    auth0 = {
      appState$: of(undefined),
      user$: of({ sub: 'auth0|me' }),
      isAuthenticated$: of(true),
      isLoading$: of(false),
      logout: jest.fn().mockReturnValue(of(undefined)),
      loginWithRedirect: jest.fn().mockReturnValue(of(undefined)),
    };
    accountData = { clearForLogout: jest.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth0Service, useValue: auth0 },
        { provide: AccountDataService, useValue: accountData },
        { provide: Router, useValue: { navigateByUrl: jest.fn() } },
      ],
    });
  });

  it('clears account data for the signed-in account, then logs out', async () => {
    await TestBed.inject(AuthService).logout();

    expect(accountData.clearForLogout).toHaveBeenCalledWith('auth0|me');
    expect(auth0.logout).toHaveBeenCalledTimes(1);
  });

  it('stays signed in when clearing is cancelled', async () => {
    accountData.clearForLogout.mockResolvedValue(false);

    await TestBed.inject(AuthService).logout();

    expect(auth0.logout).not.toHaveBeenCalled();
  });

  it('keeps account data when a dead token is recovered', () => {
    TestBed.inject(AuthRecoveryService).recover();

    expect(auth0.logout).toHaveBeenCalledWith({ openUrl: false });
    expect(auth0.loginWithRedirect).toHaveBeenCalled();
    expect(accountData.clearForLogout).not.toHaveBeenCalled();
  });
});
