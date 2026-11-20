import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import {
  DISCORD_ERROR,
  DiscordConnectionService,
} from '@pdz/features/account/discord-connection.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { Observable, of, throwError } from 'rxjs';
import { LeagueSignUpComponent } from './league-sign-up.component';

const baseMe: Me = {
  sub: 'google-oauth2|1',
  profileId: null,
  displayName: 'Ash Ketchum',
  profile: { gameName: null, timezone: null },
  privateProfile: false,
  roles: [],
  settings: {},
  discord: null,
  joined: '',
  lastLogin: '',
};

describe('LeagueSignUpComponent prefill', () => {
  let me: Me | null;
  let fixture: ComponentFixture<LeagueSignUpComponent>;
  let signUp: jest.Mock;
  let reload: jest.Mock;
  let leagueInfo: Partial<League.LeagueInfo>;
  let discord: { begin: jest.Mock; go: jest.Mock };
  const connectedMe: Me = {
    ...baseMe,
    discord: { id: '1', username: 'ash_k', connectedAt: '', viaSignIn: false },
  };
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function create(): LeagueSignUpComponent {
    const leagueService = {
      getCoachData: () => of(null),
      getLeagueInfo: () =>
        of({
          name: 'League',
          format: 'Singles',
          ruleset: 'Gen9',
          ...leagueInfo,
        } as League.LeagueInfo),
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
        { provide: DiscordConnectionService, useValue: discord },
        {
          provide: RoleService,
          useValue: { me$: of(me) as Observable<Me | null>, reload },
        },
      ],
    });
    fixture = TestBed.createComponent(LeagueSignUpComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function submitButton(): HTMLButtonElement {
    const el: HTMLElement = fixture.nativeElement;
    return Array.from(el.querySelectorAll('button')).find(
      (candidate) => candidate.type === 'submit',
    )!;
  }

  function connectButton(): HTMLButtonElement | undefined {
    const el: HTMLElement = fixture.nativeElement;
    return Array.from(el.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes('Connect Discord'),
    );
  }

  function ready(component: LeagueSignUpComponent): void {
    component.signupForm.patchValue({ gameName: 'AshK', confirm: true });
    component.identity.set({ source: 'custom', name: 'Owls', logo: null });
  }

  beforeEach(() => {
    leagueInfo = {};
    discord = {
      begin: jest.fn(() => of({ url: 'https://discord.com/oauth2/authorize' })),
      go: jest.fn(),
    };
    signUp = jest.fn(() => of({}));
    reload = jest.fn(() => of(baseMe));
    me = baseMe;
  });

  it('fills the coach name, Showdown name and time zone from the profile', () => {
    me = {
      ...baseMe,
      profile: { gameName: 'AshShowdown', timezone: 'Asia/Tokyo' },
    };
    const form = create().signupForm;
    expect(form.getRawValue()).toEqual(
      expect.objectContaining({
        name: 'Ash Ketchum',
        gameName: 'AshShowdown',
        timezone: 'Asia/Tokyo',
      }),
    );
  });

  it('has no Discord control on the form', () => {
    const component = create();
    const el: HTMLElement = fixture.nativeElement;
    expect('discordName' in component.signupForm.controls).toBe(false);
    expect(el.querySelector('input[formControlName=discordName]')).toBeNull();
  });

  it('keeps the device time zone when the profile has none', () => {
    expect(create().signupForm.controls.timezone.value).toBe(deviceZone);
  });

  it('shows a connected Discord username as fixed', () => {
    me = connectedMe;
    create();
    const el: HTMLElement = fixture.nativeElement;
    expect(connectButton()).toBeUndefined();
    expect(el.querySelector('.fixed-value__text')?.textContent).toContain(
      'ash_k',
    );
  });

  it('shows a connected Discord as fixed even when the tournament requires it', () => {
    leagueInfo = { requireDiscord: true };
    me = connectedMe;
    const component = create();
    const el: HTMLElement = fixture.nativeElement;
    expect(connectButton()).toBeUndefined();
    expect(el.querySelector('.fixed-value__text')?.textContent).toContain(
      'ash_k',
    );
    ready(component);
    fixture.detectChanges();
    expect(submitButton().disabled).toBe(false);
  });

  it('offers Connect Discord as optional and allows submit when not required', async () => {
    leagueInfo = { requireDiscord: false };
    const component = create();
    const el: HTMLElement = fixture.nativeElement;
    expect(connectButton()).toBeDefined();
    expect(el.textContent).toContain('Optional');
    expect(el.textContent).toContain('coach role');
    ready(component);
    fixture.detectChanges();
    expect(submitButton().disabled).toBe(false);
    await component.onSubmit();
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp.mock.calls[0][0]).not.toHaveProperty('discordName');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('says Discord is required and blocks submit when required and not connected', async () => {
    leagueInfo = { requireDiscord: true };
    const component = create();
    const el: HTMLElement = fixture.nativeElement;
    expect(connectButton()).toBeDefined();
    expect(el.textContent).toContain('requires a connected Discord account');
    expect(submitButton().disabled).toBe(true);
    ready(component);
    await component.onSubmit();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('submits without a Discord name', async () => {
    me = connectedMe;
    const component = create();
    ready(component);
    await component.onSubmit();
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp.mock.calls[0][0]).not.toHaveProperty('discordName');
  });

  it('returns to the sign-up address after connecting', () => {
    leagueInfo = { requireDiscord: true };
    create();
    connectButton()!.click();
    expect(discord.begin).toHaveBeenCalledWith(TestBed.inject(Router).url);
    expect(discord.go).toHaveBeenCalledWith(
      'https://discord.com/oauth2/authorize',
    );
  });

  it('marks Discord required when sign-up is refused for lacking one', async () => {
    const refusal = new ApiError(
      new HttpErrorResponse({
        status: 403,
        error: { error: { code: DISCORD_ERROR.required, message: 'needs it' } },
      }),
    );
    signUp.mockReturnValue(throwError(() => refusal));
    const component = create();
    ready(component);
    await component.onSubmit();
    fixture.detectChanges();
    expect(connectButton()).toBeDefined();
    expect(component.submitError()).toBeNull();
    expect(submitButton().disabled).toBe(true);
  });

  it('does not reload Me when sign-up fails', async () => {
    signUp.mockReturnValue(throwError(() => new Error('nope')));
    const component = create();
    ready(component);
    await component.onSubmit();
    expect(reload).not.toHaveBeenCalled();
  });
});
