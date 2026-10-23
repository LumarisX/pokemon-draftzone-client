import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TierListService } from '@pdz/features/tier-lists/tier-list.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { TournamentCreateComponent } from './tournament-create.component';

function summary(
  overrides: Partial<League.LeagueSummary> = {},
): League.LeagueSummary {
  return {
    name: 'Spring League',
    leagueSlug: 'league01',
    tournaments: [],
    isOwner: true,
    role: 'owner',
    newTournamentDefaults: {
      ownerName: 'Host',
      copyFrom: { tournamentSlug: 'season01', name: 'Season 1' },
      tierLists: [
        {
          tournamentSlug: 'season01',
          name: 'Season 1',
          format: 'Singles',
          ruleset: 'Gen9 NatDex',
        },
      ],
    },
    hosting: { canHost: true, canCreateTournament: true, reason: null },
    ...overrides,
  };
}

describe('TournamentCreateComponent', () => {
  let createTournament: jest.Mock;
  let navigate: jest.Mock;
  let getTierListBySlug: jest.Mock;

  function setup(league = summary(), query: Record<string, string> = {}) {
    createTournament = jest
      .fn()
      .mockReturnValue(of({ tournamentSlug: 'season02' }));
    navigate = jest.fn();
    getTierListBySlug = jest.fn().mockReturnValue(
      of({
        tierList: [],
        name: 'Community OU',
        format: 'Singles',
        ruleset: 'Gen9 NatDex',
        meta: { slug: 'community-ou', authorName: 'Brock' },
      }),
    );

    TestBed.configureTestingModule({
      imports: [TournamentCreateComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ leagueSlug: 'league01' }),
              queryParamMap: convertToParamMap(query),
            },
          },
        },
        {
          provide: LeagueZoneService,
          useValue: { getLeague: () => of(league), createTournament },
        },
        { provide: TierListService, useValue: { getTierListBySlug } },
        { provide: ToastService, useValue: { success: jest.fn(), error: jest.fn() } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(TournamentCreateComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      name: { set(value: string): void };
      ownerName: () => string;
      copySettings: { (): boolean; set(value: boolean): void };
      tierListFrom: { (): string; set(value: string): void };
      pickedList: () => { slug: string; name: string } | null;
      clearPicked(): void;
      requirementsDropped: () => boolean;
      showOwnerNameField: () => boolean;
      canSubmit: () => boolean;
      submit(): void;
    };
  }

  it('preselects the tier list it was started from and sends it as the source', () => {
    const component = setup(summary(), { tierList: 'community-ou' });
    component.name.set('Season 2');
    component.copySettings.set(false);

    expect(getTierListBySlug).toHaveBeenCalledWith('community-ou');
    expect(component.pickedList()?.name).toBe('Community OU');

    component.submit();

    expect(createTournament).toHaveBeenCalledWith('league01', {
      name: 'Season 2',
      ownerName: 'Host',
      tierListSlug: 'community-ou',
      tierListFrom: null,
    });
  });

  it('falls back to the past seasons once a picked list is removed', () => {
    const component = setup(summary(), { tierList: 'community-ou' });
    component.name.set('Season 2');
    component.copySettings.set(false);
    component.clearPicked();

    component.submit();

    expect(createTournament.mock.calls[0][1]).toEqual({
      name: 'Season 2',
      ownerName: 'Host',
      tierListFrom: 'season01',
    });
  });

  it('prefills the owner name from the latest tournament', () => {
    const component = setup();
    expect(component.ownerName()).toBe('Host');
    expect(component.showOwnerNameField()).toBe(false);
  });

  it('copies the latest tournament by default', () => {
    const component = setup();
    expect(component.copySettings()).toBe(true);
  });

  it('sends only the name, organizer and tier list for a blank tournament', () => {
    const component = setup();
    component.name.set(' Season 2 ');
    component.copySettings.set(false);

    component.submit();

    expect(createTournament).toHaveBeenCalledWith('league01', {
      name: 'Season 2',
      ownerName: 'Host',
      tierListFrom: 'season01',
    });
    expect(navigate).toHaveBeenCalledWith([
      '/',
      'leagues',
      'league01',
      'tournaments',
      'season02',
      'manage',
    ]);
  });

  it('sends only the copy source when copying settings', () => {
    const component = setup();
    component.name.set('Season 2');
    component.copySettings.set(true);

    component.submit();

    const payload = createTournament.mock.calls[0][1];
    expect(payload.copyFrom).toBe('season01');
    expect(payload).not.toHaveProperty('draftCount');
    expect(payload).not.toHaveProperty('diffMode');
  });

  it('branches the latest tier list by default', () => {
    const component = setup();
    expect(component.tierListFrom()).toBe('season01');
  });

  it('sends a null tier list source when starting without one', () => {
    const component = setup();
    component.name.set('Season 2');
    component.tierListFrom.set('');

    component.submit();

    expect(createTournament.mock.calls[0][1].tierListFrom).toBeNull();
  });

  it('warns that requirements drop when branching a different list than the copy source', () => {
    const component = setup(
      summary({
        newTournamentDefaults: {
          ownerName: 'Host',
          copyFrom: { tournamentSlug: 'season02', name: 'Season 2' },
          tierLists: [
            {
              tournamentSlug: 'season01',
              name: 'Season 1',
              format: null,
              ruleset: null,
            },
          ],
        },
      }),
    );
    component.copySettings.set(true);

    expect(component.requirementsDropped()).toBe(true);
    component.tierListFrom.set('');
    expect(component.requirementsDropped()).toBe(false);
  });

  it('asks for an organizer name when none is known, and blocks submission without one', () => {
    const component = setup(
      summary({
        newTournamentDefaults: { ownerName: null, copyFrom: null, tierLists: [] },
      }),
    );
    component.name.set('Season 2');

    expect(component.showOwnerNameField()).toBe(true);
    expect(component.canSubmit()).toBe(false);
  });
});
