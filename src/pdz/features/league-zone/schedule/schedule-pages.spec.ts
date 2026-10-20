import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LeagueManageService } from '@pdz/features/league-zone/league-manage/league-manage.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { of } from 'rxjs';
import { ScheduleManagePageComponent } from './schedule-manage-page.component';
import { SchedulePageComponent } from './schedule-page.component';
import { TournamentBracket } from './tournament-bracket.model';

const teams = ['a', 'b', 'c', 'd'].map((id, index) => ({
  seed: index + 1,
  teamId: id,
  teamSlug: id,
  teamName: `Team ${id.toUpperCase()}`,
  coachName: `Coach ${id}`,
}));

function bracket(currentRoundIndex: number): TournamentBracket {
  return {
    rounds: [
      { _id: 'r1', name: 'Week 1', matchDeadline: '2026-10-25T23:59:00.000Z' },
      { _id: 'r2', name: 'Week 2' },
      { _id: 'r3', name: 'Week 3' },
    ],
    currentRoundIndex,
    stages: [
      {
        _id: 'groups',
        slug: 'groups',
        name: 'Group A',
        type: 'round-robin',
        order: 0,
        public: true,
        seeding: null,
        teams,
      },
      {
        _id: 'po',
        slug: 'po',
        name: 'Playoffs',
        type: 'single-elimination',
        order: 1,
        public: false,
        seeding: null,
        teams: [],
        entrants: [
          { seed: 1, kind: 'place', teamId: null, sourceStageId: 'groups', place: 1 },
          { seed: 2, kind: 'place', teamId: null, sourceStageId: 'groups', place: 2 },
        ],
      },
    ],
    projections: [
      {
        stageId: 'groups',
        complete: false,
        standings: teams.map((team, index) => ({
          ...team,
          wins: 3 - index,
          draws: 0,
          losses: index,
          points: 9 - 3 * index,
          gameDiff: 4 - 2 * index,
        })),
      },
    ],
    matches: [
      {
        _id: 'm1',
        slug: 'm1',
        stage: 'groups',
        round: 'r1',
        position: 0,
        label: null,
        a: { type: 'seed', seed: 1 },
        b: { type: 'seed', seed: 2 },
        winner: 0,
        score: [2, 1],
      },
      {
        _id: 'm2',
        slug: 'm2',
        stage: 'groups',
        round: 'r1',
        position: 1,
        label: null,
        a: { type: 'seed', seed: 3 },
        b: { type: 'seed', seed: 4 },
      },
      {
        _id: 'final',
        slug: 'final',
        stage: 'po',
        round: 'r3',
        position: 0,
        label: 'Final',
        a: { type: 'seed', seed: 1 },
        b: { type: 'seed', seed: 2 },
      },
    ],
  };
}

const leagueService = (current: number) => ({
  leagueSlug: signal('league'),
  tournamentSlug: signal('season'),
  getTournamentBracket: () => of(bracket(current)),
  getLeagueInfo: () => of(null),
  getTournamentTeams: () =>
    of({
      teams: teams.map((team) => ({
        id: team.teamId,
        teamName: team.teamName,
        coachName: team.coachName,
        pickCount: 0,
        status: 'approved',
        pool: { poolSlug: 'p', name: 'Kanto' },
        roster: [],
      })),
    }),
});

const base = [provideRouter([]), provideHttpClient(), provideHttpClientTesting()];

describe('schedule pages', () => {
  it('shows the live week on the public page with linked matches', async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulePageComponent],
      providers: [
        ...base,
        { provide: LeagueZoneService, useValue: leagueService(0) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SchedulePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Week 1');
    expect(text).toContain('Team A');
    expect(text).toContain('Group A');
    expect(text).not.toContain('Add Stage');
    expect(fixture.nativeElement.querySelectorAll('pdz-schedule-match')).toHaveLength(2);
  });

  it('opens on a stage for organizers and shows who holds each place', async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleManagePageComponent],
      providers: [
        ...base,
        { provide: LeagueZoneService, useValue: leagueService(-1) },
        {
          provide: LeagueManageService,
          useValue: { getTournamentBracket: () => of(bracket(-1)) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScheduleManagePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Add Stage');
    expect(host.querySelectorAll('.timeline__bar')).toHaveLength(2);

    (host.querySelectorAll('.timeline__bar')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Single Elimination');
    expect(host.textContent).toContain('Group A · 1st');
    expect(host.textContent).toContain('Now: Team A');
    expect(host.textContent).toContain('Seeds come from the final standings');
  });

  it('adds a triple elimination stage of standings places from the dialog', async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleManagePageComponent],
      providers: [
        ...base,
        { provide: LeagueZoneService, useValue: leagueService(-1) },
        {
          provide: LeagueManageService,
          useValue: { getTournamentBracket: () => of(bracket(-1)) },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScheduleManagePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const buttonIn = (root: ParentNode, text: string) =>
      [...root.querySelectorAll('button')].find(
        (button) => button.textContent?.trim().endsWith(text),
      ) as HTMLButtonElement;

    buttonIn(host, 'Add Stage').click();
    await fixture.whenStable();
    fixture.detectChanges();
    const dialog = document.querySelector('pdz-add-stage-dialog')!;
    expect(dialog).toBeTruthy();

    buttonIn(dialog, 'Top 4 from Group A').click();
    fixture.detectChanges();
    buttonIn(dialog, '3 · Triple').click();
    fixture.detectChanges();

    expect(dialog.textContent).toContain('Triple Elimination · 4 entrants');
    buttonIn(dialog, 'Add Stage').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('.timeline__bar')).toHaveLength(3);
    expect(host.textContent).toContain('Triple Elimination');
    expect(host.textContent).toContain('1 unsaved change');
  });
});
