import { TestBed } from '@angular/core/testing';
import { ApiService } from '@pdz/core/services/api.service';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { AccountDataService } from './account-data.service';

const ME = 'auth0|me';
const plans = JSON.stringify([{ draftName: 'Rain', team: [{ id: 'pikachu' }] }]);
const edited = JSON.stringify([
  { draftName: 'Rain', team: [{ id: 'pikachu' }, { id: 'kyogre' }] },
]);

function mark(key: string, json: string, sub = ME): void {
  localStorage.setItem(`${key}:sync`, JSON.stringify({ sub, revision: 1, json }));
}

describe('AccountDataService', () => {
  let confirm: jest.Mock;
  let service: AccountDataService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('pdz-theme');
    confirm = jest.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: {} },
        { provide: DialogService, useValue: { confirm } },
      ],
    });
    service = TestBed.inject(AccountDataService);
  });

  it('clears settings and puts the default theme back at once', async () => {
    const settings = TestBed.inject(SettingsService);
    settings.setSettings({ theme: 'ocean', ldMode: 'dark' });
    expect(document.documentElement.getAttribute('pdz-theme')).toBe('ocean');

    await expect(service.clearForLogout(ME)).resolves.toBe(true);

    expect(localStorage.getItem('user-settings')).toBeNull();
    expect(settings.settingsData).toEqual({});
    expect(document.documentElement.getAttribute('pdz-theme')).toBe('classic');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('removes synced plans and their markers without asking', async () => {
    localStorage.setItem('plannerData', plans);
    mark('plannerData', plans);
    localStorage.setItem('plannerData:l/t', plans);
    mark('plannerData:l/t', plans);

    await expect(service.clearForLogout(ME)).resolves.toBe(true);

    expect(confirm).not.toHaveBeenCalled();
    expect(localStorage.getItem('plannerData')).toBeNull();
    expect(localStorage.getItem('plannerData:sync')).toBeNull();
    expect(localStorage.getItem('plannerData:l/t')).toBeNull();
    expect(localStorage.getItem('plannerData:l/t:sync')).toBeNull();
  });

  it('asks before removing plans the server never received', async () => {
    localStorage.setItem('plannerData', edited);
    mark('plannerData', plans);

    await service.clearForLogout(ME);

    expect(confirm).toHaveBeenCalledWith(
      'Log Out With Unsaved Plans?',
      expect.objectContaining({ confirmLabel: 'Log Out Anyway' }),
    );
    expect(localStorage.getItem('plannerData')).toBeNull();
    expect(localStorage.getItem('plannerData:sync')).toBeNull();
  });

  it('clears nothing when the confirm is cancelled', async () => {
    confirm.mockResolvedValue(false);
    localStorage.setItem('plannerData', edited);
    mark('plannerData', plans);
    localStorage.setItem('plannerData:l/t', plans);
    mark('plannerData:l/t', plans);
    localStorage.setItem('user-settings', JSON.stringify({ theme: 'ocean' }));

    await expect(service.clearForLogout(ME)).resolves.toBe(false);

    expect(localStorage.getItem('plannerData')).toBe(edited);
    expect(localStorage.getItem('plannerData:sync')).not.toBeNull();
    expect(localStorage.getItem('plannerData:l/t')).toBe(plans);
    expect(localStorage.getItem('user-settings')).not.toBeNull();
  });

  it('leaves planner work with no marker alone', async () => {
    localStorage.setItem('plannerData', edited);
    localStorage.setItem('plannerData:l/t', edited);

    await service.clearForLogout(ME);

    expect(confirm).not.toHaveBeenCalled();
    expect(localStorage.getItem('plannerData')).toBe(edited);
    expect(localStorage.getItem('plannerData:l/t')).toBe(edited);
  });

  it("does not ask about another account's stale plans, and clears them", async () => {
    localStorage.setItem('plannerData', edited);
    mark('plannerData', plans, 'auth0|other');

    await expect(service.clearForLogout(ME)).resolves.toBe(true);

    expect(confirm).not.toHaveBeenCalled();
    expect(localStorage.getItem('plannerData')).toBeNull();
  });

  it('leaves device-bound keys alone', async () => {
    const device: Record<string, string> = {
      'pdz-wheel-items': 'a',
      'pdz-saved-searches': '[]',
      binderData: '{}',
      newsTime: '1',
      pdz_teambuilder_pending: '{}',
      'league-power-rankings': '{}',
    };
    for (const [key, value] of Object.entries(device))
      localStorage.setItem(key, value);

    await service.clearForLogout(ME);

    for (const [key, value] of Object.entries(device))
      expect(localStorage.getItem(key)).toBe(value);
  });
});
