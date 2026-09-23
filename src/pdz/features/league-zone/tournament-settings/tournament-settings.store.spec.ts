import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import {
  DiscordSettingsResponse,
  LeagueManageService,
} from '../league-manage/league-manage.service';
import { LeagueZoneService } from '../league-zone.service';
import { TournamentSettingsStore } from './tournament-settings.store';

const LINKED: DiscordSettingsResponse = {
  guildId: '111111111111111111',
  guildName: 'Kanto League',
  linkedAt: '2026-09-23T00:00:00.000Z',
  coachRoleId: '222222222222222222',
  signUpChannelId: '333333333333333333',
};

function settingsWith(discordSettings?: DiscordSettingsResponse) {
  return {
    name: 'Spring Cup',
    forfeit: { gameDiff: 0, pokemonDiff: 0 },
    diffMode: 'pokemon' as const,
    tierListId: '',
    draftCount: { min: 1, max: 6 },
    tierRequirements: [],
    discordSettings,
  };
}

describe('TournamentSettingsStore Discord link', () => {
  let store: TournamentSettingsStore;
  let manage: {
    getTournamentSettings: jest.Mock;
    unlinkDiscord: jest.Mock;
    getSchedule: jest.Mock;
    getTrades: jest.Mock;
  };

  beforeEach(() => {
    manage = {
      getTournamentSettings: jest.fn(() => of(settingsWith(LINKED))),
      unlinkDiscord: jest.fn(() => of({ success: true })),
      getSchedule: jest.fn(() => throwError(() => new Error('none'))),
      getTrades: jest.fn(() => throwError(() => new Error('none'))),
    };

    TestBed.configureTestingModule({
      providers: [
        TournamentSettingsStore,
        { provide: LeagueManageService, useValue: manage },
        {
          provide: LeagueZoneService,
          useValue: {
            getSignUps: () => throwError(() => new Error('none')),
            getRules: () => throwError(() => new Error('none')),
          },
        },
        {
          provide: TierListService,
          useValue: { getTierList: () => throwError(() => new Error('none')) },
        },
      ],
    });
    store = TestBed.inject(TournamentSettingsStore);
    store.load();
  });

  it('exposes the linked server after loading', () => {
    expect(store.discordLink()).toEqual({
      guildId: LINKED.guildId,
      guildName: 'Kanto League',
      verified: true,
    });
  });

  it('marks a server entered before linking existed as unverified', async () => {
    manage.getTournamentSettings.mockReturnValue(
      of(settingsWith({ guildId: LINKED.guildId })),
    );

    await firstValueFrom(store.refreshDiscordLink());

    expect(store.discordLink()?.verified).toBe(false);
  });

  it('keeps unsaved role edits when the same server is still linked', async () => {
    store.write('discordCoachRoleId', '444444444444444444');

    await firstValueFrom(store.refreshDiscordLink());

    expect(store.read<string>('discordCoachRoleId')).toBe('444444444444444444');
  });

  it('clears the role and channel when a different server gets linked, without leaving them dirty', async () => {
    store.write('discordCoachRoleId', '444444444444444444');
    manage.getTournamentSettings.mockReturnValue(
      of(settingsWith({ guildId: '555555555555555555', guildName: 'Johto' })),
    );

    await firstValueFrom(store.refreshDiscordLink());

    expect(store.read<string>('discordGuildId')).toBe('555555555555555555');
    expect(store.read<string>('discordCoachRoleId')).toBe('');
    expect(store.read<string>('discordSignUpChannelId')).toBe('');
    expect(store.dirtyKeys()).not.toContain('discordCoachRoleId');
    expect(store.dirtyKeys()).not.toContain('discordGuildId');
  });

  it('forgets the server, role and channel on unlink', async () => {
    await firstValueFrom(store.unlinkDiscord());

    expect(store.discordLink()).toBeNull();
    expect(store.read<string>('discordGuildId')).toBe('');
    expect(store.read<string>('discordCoachRoleId')).toBe('');
  });
});
