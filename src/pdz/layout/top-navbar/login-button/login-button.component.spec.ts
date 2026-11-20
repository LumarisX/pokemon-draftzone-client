import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { of } from 'rxjs';
import { LoginButtonComponent } from './login-button.component';

const me: Me = {
  sub: 'auth0|1',
  profileId: null,
  displayName: 'Ash Ketchum',
  profile: { gameName: null, timezone: null },
  privateProfile: false,
  roles: [],
  settings: {},
  discord: null,
  joined: '',
  lastLogin: '',
  deletionScheduledFor: null,
};

describe('LoginButtonComponent', () => {
  const common = [
    provideRouter([]),
    provideHttpClient(),
    provideHttpClientTesting(),
  ];

  it('shows a log in button when signed out', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginButtonComponent],
      providers: [provideAuthStub(), ...common],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginButtonComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.authenticated()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Log In');
  });

  it('shows the display name from Me, not the sign-in token', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginButtonComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: of(true),
            user$: of({ sub: 'auth0|1', username: 'Token Name' }),
            login: () => undefined,
            logout: () => undefined,
          },
        },
        { provide: RoleService, useValue: { me$: of(me) } },
        ...common,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginButtonComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ash Ketchum');
    expect(text).not.toContain('Token Name');
  });

  it('links the Settings menu item to the settings page', async () => {
    await TestBed.configureTestingModule({
      imports: [LoginButtonComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: of(true),
            user$: of(null),
            login: () => undefined,
            logout: () => undefined,
          },
        },
        { provide: RoleService, useValue: { me$: of(me) } },
        ...common,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginButtonComponent);
    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a[pdz-menu-item]'),
    ) as HTMLAnchorElement[];
    const link = links.find((a) => a.textContent?.includes('Settings'));
    expect(link?.getAttribute('href')).toBe('/settings');
  });
});
