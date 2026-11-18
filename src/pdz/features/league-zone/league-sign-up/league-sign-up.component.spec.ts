import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { Observable, of, throwError } from 'rxjs';
import { LeagueSignUpComponent } from './league-sign-up.component';

const baseMe: Me = {
  sub: 'google-oauth2|1',
  profileId: null,
  displayName: 'Ash Ketchum',
  profile: { discordName: null, gameName: null, timezone: null },
  privateProfile: false,
  roles: [],
  settings: {},
  joined: '',
  lastLogin: '',
};

describe('LeagueSignUpComponent prefill', () => {
  let me: Me | null;
  let user: { sub: string; username: string } | null;
  let fixture: ComponentFixture<LeagueSignUpComponent>;
  let signUp: jest.Mock;
  let reload: jest.Mock;
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function create(): LeagueSignUpComponent {
    const leagueService = {
      getCoachData: () => of(null),
      getLeagueInfo: () =>
        of({ name: 'League', format: 'Singles', ruleset: 'Gen9' } as League.LeagueInfo),
      leagueSlug: () => 'league',
      tournamentSlug: () => 'season',
      signUp,
    };
    TestBed.configureTestingModule({
      imports: [LeagueSignUpComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LeagueZoneService, useValue: leagueService },
        {
          provide: RoleService,
          useValue: { me$: of(me) as Observable<Me | null>, reload },
        },
        {
          provide: AuthService,
          useValue: { isAuthenticated$: of(true), user$: of(user) },
        },
      ],
    });
    fixture = TestBed.createComponent(LeagueSignUpComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    signUp = jest.fn(() => of({}));
    reload = jest.fn(() => of(baseMe));
    me = baseMe;
    user = { sub: 'google-oauth2|1', username: 'Token Name' };
  });

  it('fills the coach name, Showdown name, Discord name and time zone from the profile', () => {
    me = {
      ...baseMe,
      profile: {
        discordName: 'ash#1',
        gameName: 'AshShowdown',
        timezone: 'Asia/Tokyo',
      },
    };
    const form = create().signupForm;
    expect(form.getRawValue()).toEqual(
      expect.objectContaining({
        name: 'Ash Ketchum',
        gameName: 'AshShowdown',
        discordName: 'ash#1',
        timezone: 'Asia/Tokyo',
      }),
    );
  });

  it('prefers the profile Discord name over the sign-in token', () => {
    user = { sub: 'oauth2|discord|9', username: 'token_discord' };
    me = { ...baseMe, profile: { ...baseMe.profile, discordName: 'saved#2' } };
    expect(create().signupForm.controls.discordName.value).toBe('saved#2');
  });

  it('falls back to the Discord sign-in name when the profile has none', () => {
    user = { sub: 'oauth2|discord|9', username: 'token_discord' };
    expect(create().signupForm.controls.discordName.value).toBe(
      'token_discord',
    );
  });

  it('leaves Discord empty for a Google sign-in with no saved name', () => {
    expect(create().signupForm.controls.discordName.value).toBe('');
  });

  it('keeps the device time zone when the profile has none', () => {
    expect(create().signupForm.controls.timezone.value).toBe(deviceZone);
  });

  it('shows the account Discord name as a read-only line with a link to settings', () => {
    me = { ...baseMe, profile: { ...baseMe.profile, discordName: 'ash#1' } };
    create();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[formControlName=discordName]')).toBeNull();
    expect(el.querySelector('.fixed-value__text')?.textContent).toContain(
      'ash#1',
    );
    const link = el.querySelector<HTMLAnchorElement>('.fixed-value a')!;
    expect(link.textContent).toContain('Change in Settings');
    expect(link.getAttribute('href')).toBe('/settings#league-defaults');
  });

  it('keeps the Discord field editable with a hint when the account has none', () => {
    create();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[formControlName=discordName]')).not.toBeNull();
    expect(el.textContent).toContain('Saved to your account');
    expect(el.querySelector('.fixed-value')).toBeNull();
  });

  it('submits the account Discord name and reloads Me', async () => {
    me = { ...baseMe, profile: { ...baseMe.profile, discordName: 'ash#1' } };
    const component = create();
    component.signupForm.patchValue({ gameName: 'AshK', confirm: true });
    component.identity.set({ source: 'custom', name: 'Owls', logo: null });
    await component.onSubmit();
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp.mock.calls[0][0]).toEqual(
      expect.objectContaining({ discordName: 'ash#1' }),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload Me when sign-up fails', async () => {
    signUp.mockReturnValue(throwError(() => new Error('nope')));
    const component = create();
    component.signupForm.patchValue({
      gameName: 'AshK',
      discordName: 'ash#1',
      confirm: true,
    });
    component.identity.set({ source: 'custom', name: 'Owls', logo: null });
    await component.onSubmit();
    expect(reload).not.toHaveBeenCalled();
  });
});
