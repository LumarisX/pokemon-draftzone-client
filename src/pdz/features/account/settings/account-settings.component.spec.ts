import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { Observable, of, throwError } from 'rxjs';
import { DiscordConnectionService } from '../discord-connection.service';
import { signInMethodLabel } from '../sign-in-method';
import { AccountSettingsComponent } from './account-settings.component';

const base: Me = {
  sub: 'auth0|1',
  profileId: '65a1b2c3d4e5f60718293a4b',
  displayName: 'Ash Ketchum',
  profile: {
    gameName: 'AshK',
    timezone: 'America/New_York',
  },
  privateProfile: false,
  roles: [],
  settings: {},
  discord: null,
  joined: '',
  lastLogin: '',
  deletionScheduledFor: null,
};

function apiError(status: number, message: string): ApiError {
  return new ApiError(
    new HttpErrorResponse({ status, error: { error: { message } } }),
  );
}

describe('AccountSettingsComponent', () => {
  let fixture: ComponentFixture<AccountSettingsComponent>;
  let api: { patch: jest.Mock; get: jest.Mock; post: jest.Mock };
  let logout: jest.Mock;
  let roleService: {
    me$: Observable<Me | null>;
    setMe: jest.Mock;
    reload: jest.Mock;
  };
  let dialog: { confirm: jest.Mock };
  let discord: { begin: jest.Mock; disconnect: jest.Mock; go: jest.Mock };
  let me: Me | null;
  let sub: string;

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function input(name: string): HTMLInputElement {
    return el().querySelector<HTMLInputElement>(`input[name=${name}]`)!;
  }

  function type(name: string, value: string): void {
    const field = input(name);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(el().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    ) as HTMLButtonElement;
  }

  async function save(): Promise<void> {
    button('Save Changes').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function create(): void {
    TestBed.configureTestingModule({
      imports: [AccountSettingsComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: RoleService, useValue: roleService },
        { provide: DialogService, useValue: dialog },
        { provide: DiscordConnectionService, useValue: discord },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: of(true),
            user$: of({ sub, username: 'x' }),
            logout,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(AccountSettingsComponent);
    fixture.detectChanges();
  }

  beforeEach(() => {
    me = base;
    sub = 'google-oauth2|123';
    logout = jest.fn(() => Promise.resolve());
    api = {
      get: jest.fn(() => of({ scheduledFor: null, blockers: [] })),
      post: jest.fn(() => of({ scheduledFor: '2026-12-20T00:00:00.000Z' })),
      patch: jest.fn((_path: string, body: object) =>
        of({
          ...base,
          displayName: (body as { displayName?: string }).displayName ?? base.displayName,
          profile: { ...base.profile, ...body },
        }),
      ),
    };
    roleService = {
      get me$() {
        return of(me);
      },
      setMe: jest.fn(),
      reload: jest.fn(() => of(base)),
    };
    dialog = {
      confirm: jest.fn(() => Promise.resolve(true)),
    };
    discord = {
      begin: jest.fn(() => of({ url: 'https://discord.com/oauth2/authorize' })),
      disconnect: jest.fn(() => of({ ...base, discord: null })),
      go: jest.fn(),
    };
  });

  it('loads its values from Me', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input('displayName').value).toBe('Ash Ketchum');
    expect(input('discordName')).toBeNull();
    expect(input('gameName').value).toBe('AshK');
    expect(el().querySelector('pdz-save-bar .bar')).toBeNull();
  });

  it('links to the public profile by its id', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    const link = el().querySelector<HTMLAnchorElement>('a[href^="/profile/"]');
    expect(link?.textContent).toContain('View Public Profile');
    expect(link?.getAttribute('href')).toBe('/profile/65a1b2c3d4e5f60718293a4b');
  });

  it('shows no profile link without a profile id', async () => {
    me = { ...base, profileId: null };
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el().querySelector('a[href^="/profile/"]')).toBeNull();
  });

  it('shows an error state when Me fails to load', () => {
    me = null;
    create();
    expect(el().querySelector('pdz-empty-state')).not.toBeNull();
    expect(el().querySelector('input[name=displayName]')).toBeNull();
  });

  it('sends only the changed profile fields', async () => {
    create();
    type('gameName', 'AshShowdown');
    await save();
    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(api.patch).toHaveBeenCalledWith('users/profile', {
      gameName: 'AshShowdown',
    });
    expect(roleService.setMe).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({ gameName: 'AshShowdown' }),
      }),
    );
    expect(el().querySelector('pdz-save-bar .bar')).toBeNull();
  });

  it('clears an emptied league default with null', async () => {
    create();
    type('gameName', '');
    await save();
    expect(api.patch).toHaveBeenCalledWith('users/profile', {
      gameName: null,
    });
  });

  it('sends the private profile switch in the same patch and counts it', async () => {
    create();
    const toggle = el().querySelector<HTMLInputElement>(
      'pdz-slide-toggle input[role=switch]',
    )!;
    expect(toggle.checked).toBe(false);
    toggle.click();
    fixture.detectChanges();
    expect(el().querySelector('pdz-save-bar .bar')).not.toBeNull();
    type('gameName', 'AshShowdown');
    await save();
    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(api.patch).toHaveBeenCalledWith('users/profile', {
      gameName: 'AshShowdown',
      privateProfile: true,
    });
  });

  it('blocks saving an invalid display name', () => {
    create();
    type('displayName', 'a');
    expect(button('Save Changes').disabled).toBe(true);
  });

  it('shows a profile failure on the bar and keeps the edit', async () => {
    api.patch.mockReturnValue(
      throwError(() => apiError(500, 'ignored')),
    );
    create();
    type('gameName', 'Other');
    await save();
    expect(el().querySelector('.bar__error')?.textContent).toContain(
      'Could not save your settings.',
    );
    expect(roleService.setMe).not.toHaveBeenCalled();
  });

  it('shows a single-field 400 at that field', async () => {
    api.patch.mockReturnValue(
      throwError(() => apiError(400, 'Display name is not allowed.')),
    );
    create();
    type('displayName', 'Gary');
    await save();
    expect(el().textContent).toContain('Display name is not allowed.');
  });

  it('reverts unsaved edits', async () => {
    create();
    await fixture.whenStable();
    type('gameName', 'Changed');
    button('Revert').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input('gameName').value).toBe('AshK');
  });

  it('guards leaving with unsaved changes', async () => {
    create();
    const component = fixture.componentInstance;
    expect(await component.canDeactivate()).toBe(true);
    expect(dialog.confirm).not.toHaveBeenCalled();

    type('gameName', 'Changed');
    dialog.confirm.mockReturnValue(Promise.resolve(false));
    expect(await component.canDeactivate()).toBe(false);
    expect(dialog.confirm).toHaveBeenCalledTimes(1);

    dialog.confirm.mockReturnValue(Promise.resolve(true));
    expect(await component.canDeactivate()).toBe(true);
  });

  describe('Discord row', () => {
    const connectedMe = (viaSignIn: boolean): Me => ({
      ...base,
      discord: {
        id: '1',
        username: 'ash_k',
        connectedAt: '',
        viaSignIn,
      },
    });

    async function settle(): Promise<void> {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('shows a connect line and Connect Discord, with no text input, when not connected', async () => {
      create();
      await settle();
      expect(input('discordName')).toBeNull();
      expect(el().textContent).toContain('league bots can ping you');
      expect(button('Connect Discord')).toBeDefined();
      expect(button('Disconnect')).toBeUndefined();
    });

    it('connects with a return to settings and navigates away', async () => {
      create();
      await settle();
      button('Connect Discord').click();
      await settle();
      expect(discord.begin).toHaveBeenCalledWith('/settings');
      expect(discord.go).toHaveBeenCalledWith(
        'https://discord.com/oauth2/authorize',
      );
      expect(dialog.confirm).not.toHaveBeenCalled();
    });

    it('confirms before leaving with unsaved edits', async () => {
      create();
      await settle();
      type('gameName', 'Changed');
      dialog.confirm.mockReturnValue(Promise.resolve(false));
      button('Connect Discord').click();
      await settle();
      expect(dialog.confirm).toHaveBeenCalledTimes(1);
      expect(discord.begin).not.toHaveBeenCalled();
    });

    it('shows a connect failure inline', async () => {
      discord.begin.mockReturnValue(
        throwError(() => apiError(400, 'Connecting Discord is not set up')),
      );
      create();
      await settle();
      button('Connect Discord').click();
      await settle();
      expect(el().querySelector('.account__error')?.textContent).toContain(
        'Connecting Discord is not set up',
      );
      expect(discord.go).not.toHaveBeenCalled();
    });

    it('shows the username read-only with Disconnect once connected', async () => {
      me = connectedMe(false);
      create();
      await settle();
      expect(input('discordName')).toBeNull();
      expect(el().querySelector('.account__discord-username')?.textContent).toBe(
        'ash_k',
      );
      expect(button('Disconnect')).toBeDefined();
      expect(button('Connect Discord')).toBeUndefined();
    });

    it('offers no Disconnect for a Discord sign-in', async () => {
      me = connectedMe(true);
      create();
      await settle();
      expect(el().querySelector('.account__discord-username')?.textContent).toBe(
        'ash_k',
      );
      expect(button('Disconnect')).toBeUndefined();
    });

    it('asks first, then disconnects', async () => {
      me = connectedMe(false);
      create();
      await settle();
      button('Disconnect').click();
      await settle();
      expect(dialog.confirm).toHaveBeenCalledTimes(1);
      expect(dialog.confirm.mock.calls[0][1].message).toContain(
        'stop pinging you',
      );
      expect(discord.disconnect).toHaveBeenCalledTimes(1);
      expect(button('Connect Discord')).toBeDefined();
    });

    it('does not disconnect when the confirm is declined', async () => {
      me = connectedMe(false);
      dialog.confirm.mockReturnValue(Promise.resolve(false));
      create();
      await settle();
      button('Disconnect').click();
      await settle();
      expect(discord.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('Delete Account', () => {
    async function settle(): Promise<void> {
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('links the privacy policy and terms', async () => {
      create();
      await settle();
      expect(el().querySelector('a[href="/privacy"]')).not.toBeNull();
      expect(el().querySelector('a[href="/terms"]')).not.toBeNull();
    });

    it('confirms, schedules the deletion and logs out', async () => {
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(api.get).toHaveBeenCalledWith('users/me/deletion');
      expect(dialog.confirm).toHaveBeenCalledTimes(1);
      expect(dialog.confirm.mock.calls[0][1].confirmLabel).toBe(
        'Delete Account',
      );
      expect(dialog.confirm.mock.calls[0][1].message).toContain('30 days');
      expect(api.post).toHaveBeenCalledWith('users/me/deletion', {});
      expect(logout).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the confirm is declined', async () => {
      dialog.confirm.mockReturnValue(Promise.resolve(false));
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(api.post).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    });

    it('lists blockers with links and never confirms', async () => {
      api.get.mockReturnValue(
        of({
          scheduledFor: null,
          blockers: [
            {
              kind: 'organizer',
              leagueSlug: 'pdbl',
              leagueName: 'PDBL',
              tournamentSlug: 's4',
              tournamentName: 'Season 4',
            },
            {
              kind: 'coach',
              leagueSlug: 'x',
              leagueName: 'Other',
              tournamentSlug: 't1',
              tournamentName: 'Cup',
            },
          ],
        }),
      );
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(dialog.confirm).not.toHaveBeenCalled();
      expect(api.post).not.toHaveBeenCalled();
      const links = Array.from(
        el().querySelectorAll<HTMLAnchorElement>('.account__blocker a'),
      ).map((link) => link.getAttribute('href'));
      expect(links).toEqual([
        '/leagues/pdbl/tournaments/s4',
        '/leagues/x/tournaments/t1',
      ]);
      expect(el().textContent).toContain('Final Results');
      expect(el().textContent).toContain('replace you');
    });

    it('lists the blockers a 409 returns', async () => {
      api.post.mockReturnValue(
        throwError(
          () =>
            new ApiError(
              new HttpErrorResponse({
                status: 409,
                error: {
                  error: {
                    message: 'Blocked',
                    details: {
                      blockers: [
                        {
                          kind: 'organizer',
                          leagueSlug: 'pdbl',
                          leagueName: 'PDBL',
                          tournamentSlug: 's4',
                          tournamentName: 'Season 4',
                        },
                      ],
                    },
                  },
                },
              }),
            ),
        ),
      );
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(el().querySelectorAll('.account__blocker')).toHaveLength(1);
      expect(logout).not.toHaveBeenCalled();
    });

    it('shows a failure and stays signed in', async () => {
      api.post.mockReturnValue(throwError(() => apiError(500, 'ignored')));
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(el().querySelector('.account__error')?.textContent).toContain(
        'Could not delete your account.',
      );
      expect(logout).not.toHaveBeenCalled();
    });

    it('shows a failure when the check fails', async () => {
      api.get.mockReturnValue(throwError(() => apiError(500, 'ignored')));
      create();
      await settle();
      button('Delete Account').click();
      await settle();
      expect(el().querySelector('.account__error')?.textContent).toContain(
        'Could not check your account.',
      );
      expect(dialog.confirm).not.toHaveBeenCalled();
    });
  });

  it.each([
    ['google-oauth2|1', 'Signed in with Google'],
    ['oauth2|discord|1', 'Signed in with Discord'],
    ['auth0|1', 'Signed in with Email'],
    ['samlp|1', 'Signed in'],
  ])('labels %s as "%s"', (value, label) => {
    expect(signInMethodLabel(value)).toBe(label);
    sub = value;
    create();
    expect(el().querySelector('.account__method')?.textContent?.trim()).toBe(
      label,
    );
  });
});
