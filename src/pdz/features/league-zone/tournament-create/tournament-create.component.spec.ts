import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
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

  function setup(league = summary()) {
    createTournament = jest
      .fn()
      .mockReturnValue(of({ tournamentSlug: 'season02' }));
    navigate = jest.fn();

    TestBed.configureTestingModule({
      imports: [TournamentCreateComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ leagueSlug: 'league01' }) },
          },
        },
        {
          provide: LeagueZoneService,
          useValue: { getLeague: () => of(league), createTournament },
        },
        { provide: ToastService, useValue: { success: jest.fn(), error: jest.fn() } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(TournamentCreateComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      name: { set(value: string): void };
      ownerName: () => string;
      signUpDeadline: { set(value: string): void };
      copySettings: { set(value: boolean): void };
      tierListFrom: { (): string; set(value: string): void };
      requirementsDropped: () => boolean;
      draftMin: { set(value: number): void };
      canSubmit: () => boolean;
      submit(): void;
    };
  }

  it('prefills the owner name from the latest tournament', () => {
    const component = setup();
    expect(component.ownerName()).toBe('Host');
  });

  it('sends the diff mode and draft count for a blank tournament', () => {
    const component = setup();
    component.name.set(' Season 2 ');
    component.signUpDeadline.set('2026-10-01T12:00');

    component.submit();

    expect(createTournament).toHaveBeenCalledWith('league01', {
      name: 'Season 2',
      ownerName: 'Host',
      signUpDeadline: new Date('2026-10-01T12:00').toISOString(),
      tierListFrom: 'season01',
      diffMode: 'pokemon',
      draftCount: { min: 10, max: 12 },
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
    component.signUpDeadline.set('2026-10-01T12:00');
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
    component.signUpDeadline.set('2026-10-01T12:00');
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

  it('blocks submission with an inverted roster size unless copying', () => {
    const component = setup();
    component.name.set('Season 2');
    component.signUpDeadline.set('2026-10-01T12:00');
    component.draftMin.set(20);

    expect(component.canSubmit()).toBe(false);
    component.copySettings.set(true);
    expect(component.canSubmit()).toBe(true);
  });

  it('blocks submission without a valid organizer name', () => {
    const component = setup(
      summary({
        newTournamentDefaults: { ownerName: null, copyFrom: null, tierLists: [] },
      }),
    );
    component.name.set('Season 2');
    component.signUpDeadline.set('2026-10-01T12:00');

    expect(component.canSubmit()).toBe(false);
  });
});
