import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { Observable, of, throwError } from 'rxjs';
import { signInMethodLabel } from '../sign-in-method';
import { AccountSettingsComponent } from './account-settings.component';

const base: Me = {
  sub: 'auth0|1',
  profileId: '65a1b2c3d4e5f60718293a4b',
  displayName: 'Ash Ketchum',
  profile: {
    discordName: 'ash#1',
    gameName: 'AshK',
    timezone: 'America/New_York',
  },
  privateProfile: false,
  roles: [],
  settings: {},
  joined: '',
  lastLogin: '',
};

function apiError(status: number, message: string): ApiError {
  return new ApiError(
    new HttpErrorResponse({ status, error: { error: { message } } }),
  );
}

describe('AccountSettingsComponent', () => {
  let fixture: ComponentFixture<AccountSettingsComponent>;
  let api: { patch: jest.Mock };
  let roleService: {
    me$: Observable<Me | null>;
    setMe: jest.Mock;
    reload: jest.Mock;
  };
  let dialog: { confirm: jest.Mock };
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
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: of(true),
            user$: of({ sub, username: 'x' }),
            logout: jest.fn(),
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
    api = {
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
  });

  it('loads its values from Me', async () => {
    create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input('displayName').value).toBe('Ash Ketchum');
    expect(input('discordName').value).toBe('ash#1');
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
    type('discordName', '');
    await save();
    expect(api.patch).toHaveBeenCalledWith('users/profile', {
      discordName: null,
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
    type('discordName', 'new#2');
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
