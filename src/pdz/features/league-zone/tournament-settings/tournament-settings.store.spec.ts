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
      unlinkDiscord: jest.fn(() => of({ message: 'Discord server unlinked.' })),
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

describe('TournamentSettingsStore standings rules', () => {
  function setup(settings: Record<string, unknown>) {
    const manage = {
      getTournamentSettings: jest.fn(() => of({ ...settingsWith(), ...settings })),
      getSchedule: jest.fn(() => throwError(() => new Error('none'))),
      getTrades: jest.fn(() => throwError(() => new Error('none'))),
      updateTournamentSettings: jest.fn(() => of({ message: 'Settings saved.' })),
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
    const store = TestBed.inject(TournamentSettingsStore);
    store.load();
    return { store, manage };
  }

  it('loads the points and lists every tiebreaker, the chosen ones first', () => {
    const { store } = setup({
      standingsRules: {
        points: { win: 2, draw: 1, loss: 0 },
        tiebreakers: ['headToHead', 'gameDiff'],
      },
      standingsRulesCustomized: true,
    });

    expect(store.read<number>('pointsWin')).toBe(2);
    expect(store.read<string[]>('tiebreakers')).toEqual([
      'headToHead',
      'gameDiff',
      'pokemonDiff',
      'strengthOfSchedule',
    ]);
    expect(store.tiebreakersCustomized()).toBe(true);
  });

  it('saves points and order together as standingsRules', async () => {
    const { store, manage } = setup({});

    store.write('pointsDraw', 0);
    store.write('tiebreakers', [
      'gameDiff',
      'headToHead',
      'pokemonDiff',
      'strengthOfSchedule',
    ]);
    await firstValueFrom(store.saveSettings());

    expect(manage.updateTournamentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        standingsRules: {
          points: { win: 3, draw: 0, loss: 0 },
          tiebreakers: [
            'gameDiff',
            'headToHead',
            'pokemonDiff',
            'strengthOfSchedule',
          ],
        },
      }),
    );
    expect(store.tiebreakersCustomized()).toBe(true);
  });

  it('sends only the points when the order was not touched', async () => {
    const { store, manage } = setup({});

    store.write('pointsWin', 2);
    await firstValueFrom(store.saveSettings());

    expect(manage.updateTournamentSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        standingsRules: { points: { win: 2, draw: 1, loss: 0 } },
      }),
    );
  });

  describe('locks', () => {
    const started = { seasonStart: '2020-01-01T00:00:00.000Z' };

    it('leaves standings open before the season starts', () => {
      const { store } = setup({});

      expect(store.isLocked('standings')).toBe(false);
    });

    it('locks standings and draft rules once the season starts', () => {
      const { store } = setup(started);

      expect(store.isLocked('standings')).toBe(true);
      expect(store.isLocked('draft')).toBe(true);
      expect(store.isLocked('general')).toBe(false);
    });

    it('relocks an unlocked section after a save', async () => {
      const { store } = setup(started);

      store.unlock('standings');
      expect(store.isLocked('standings')).toBe(false);

      store.write('pointsWin', 2);
      await firstValueFrom(store.saveSettings());

      expect(store.isLocked('standings')).toBe(true);
    });

    it('relocks when changes are reverted', () => {
      const { store } = setup(started);

      store.unlock('draft');
      store.revertSettings();

      expect(store.isLocked('draft')).toBe(true);
    });
  });
});

describe('TournamentSettingsStore pool assignments', () => {
  let store: TournamentSettingsStore;
  let league: { updateSignUps: jest.Mock };

  beforeEach(() => {
    const anything = () => of({});
    league = { updateSignUps: jest.fn(() => of({ message: 'ok' })) };

    TestBed.configureTestingModule({
      providers: [
        TournamentSettingsStore,
        {
          provide: LeagueManageService,
          useValue: new Proxy(
            {
              getTournamentSettings: () => of(settingsWith()),
              getSchedule: () => throwError(() => new Error('none')),
              getTrades: () => throwError(() => new Error('none')),
            } as Record<string, unknown>,
            { get: (target, key: string) => target[key] ?? anything },
          ),
        },
        {
          provide: LeagueZoneService,
          useValue: {
            ...league,
            getSignUps: () =>
              of({
                signups: [
                  {
                    id: 'coach-1',
                    applicationId: 'app-1',
                    teamId: 'team-1',
                    teamSlug: 'team-rocket',
                    name: 'Ash',
                    gameName: 'ash',
                    discordName: 'ash',
                    timezone: 'UTC',
                    experience: '',
                    status: 'approved',
                    teamName: 'Team Rocket',
                    signedUpAt: new Date('2026-09-01'),
                  },
                ],
                pools: [{ poolSlug: 'pool-a', name: 'Pool A' }],
              }),
            getRules: () => throwError(() => new Error('none')),
            getPoolDetails: () => throwError(() => new Error('none')),
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

  it('assigns by team slug, not by coach id', async () => {
    store.assignTeam('coach-1', 'pool-a');

    await firstValueFrom(store.saveSettings());

    expect(league.updateSignUps).toHaveBeenCalledWith([
      { teamSlug: 'team-rocket', pool: 'pool-a', status: 'approved' },
    ]);
  });
});

describe('TournamentSettingsStore sign-up decisions', () => {
  let store: TournamentSettingsStore;
  let decideApplication: jest.Mock;

  function applicant(applicationId: string, status: string) {
    return {
      id: null,
      applicationId,
      teamId: null,
      teamSlug: null,
      name: applicationId,
      gameName: applicationId,
      discordName: applicationId,
      timezone: 'UTC',
      experience: '',
      status,
      teamName: 'Team',
      signedUpAt: new Date('2026-09-01'),
    };
  }

  beforeEach(() => {
    const anything = () => of({});
    decideApplication = jest.fn(() => of({}));

    TestBed.configureTestingModule({
      providers: [
        TournamentSettingsStore,
        {
          provide: LeagueManageService,
          useValue: new Proxy(
            {
              getTournamentSettings: () => of(settingsWith()),
              getSchedule: () => throwError(() => new Error('none')),
              getTrades: () => throwError(() => new Error('none')),
            } as Record<string, unknown>,
            { get: (target, key: string) => target[key] ?? anything },
          ),
        },
        {
          provide: LeagueZoneService,
          useValue: {
            decideApplication,
            updateSignUps: jest.fn(() => of({})),
            getSignUps: () =>
              of({
                signups: [
                  applicant('app-pending', 'pending'),
                  applicant('app-sub', 'approved'),
                ],
                pools: [{ poolSlug: 'pool-a', name: 'Pool A' }],
              }),
            getRules: () => throwError(() => new Error('none')),
            getPoolDetails: () => throwError(() => new Error('none')),
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

  it('reads an approved applicant without a team as a sub, with nothing to save', () => {
    expect(store.applicantsDirtyCount()).toBe(0);
  });

  it('adds an applicant straight to the chosen pool', async () => {
    store.setSignUpChoice('app-pending', 'team:pool-a');

    await firstValueFrom(store.saveApplicants());

    expect(decideApplication).toHaveBeenCalledWith('app-pending', {
      status: 'approved',
      seat: 'team',
      poolSlug: 'pool-a',
    });
  });

  it('adds an applicant as a sub', async () => {
    store.setSignUpChoice('app-pending', 'sub');

    await firstValueFrom(store.saveApplicants());

    expect(decideApplication).toHaveBeenCalledWith('app-pending', {
      status: 'approved',
      seat: 'sub',
    });
  });

  it('moves a sub onto a roster in a pool', async () => {
    store.setSignUpChoice('app-sub', 'team:pool-a');

    expect(store.applicantsDirtyCount()).toBe(1);
    await firstValueFrom(store.saveApplicants());

    expect(decideApplication).toHaveBeenCalledWith('app-sub', {
      status: 'approved',
      seat: 'team',
      poolSlug: 'pool-a',
    });
  });

  it('keeps unsaved settings when applicant decisions are saved', async () => {
    store.write('name', 'Renamed');
    store.setSignUpChoice('app-pending', 'sub');

    await firstValueFrom(store.saveApplicants());

    expect(store.draft().name).toBe('Renamed');
    expect(store.settingsDirtyCount()).toBe(1);
    expect(store.applicantsDirtyCount()).toBe(0);
  });

  it('forgets a choice that is changed back', () => {
    store.setSignUpChoice('app-pending', 'sub');
    store.setSignUpChoice('app-pending', 'pending');

    expect(store.applicantsDirtyCount()).toBe(0);
  });
});
