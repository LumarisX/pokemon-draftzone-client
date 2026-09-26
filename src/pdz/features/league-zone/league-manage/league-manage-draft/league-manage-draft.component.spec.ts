import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, EMPTY } from 'rxjs';
import { By } from '@angular/platform-browser';

import { LeagueManageDraftComponent } from './league-manage-draft.component';
import { LeagueZoneService } from '../../league-zone.service';
import { PoolDetails, LeagueManageService } from '../league-manage.service';
import { TierListService } from '../../../tier-lists/tier-list.service';
import { LeagueNotificationService } from '../../league-notification.service';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { League } from '../../league.interface';

function makeTeam(id: string, name: string): League.LeagueTeam {
  return {
    id,
    slug: `${id}-slug`,
    name,
    coach: `${name} coach`,
    draft: [],
    picks: [],
    isCoach: false,
    pointTotal: 0,
  };
}

const teams = [makeTeam('t1', 'Team One'), makeTeam('t2', 'Team Two')];

function makeDetails(overrides: Partial<PoolDetails> = {}): PoolDetails {
  return {
    leagueName: 'League',
    poolName: 'Draft',
    teamOrder: ['t1', 't2'],
    useRandomSeeding: true,
    channelId: undefined,
    rounds: 3,
    minDraftCount: 0,
    tierRequirements: [],
    points: 0,
    teams,
    orderProgression: 'snake',
    sequentialTurns: true,
    picksVisibleTo: 'everyone',
    allowDuplicates: false,
    picksBlind: false,
    canSeeAllPicks: true,
    allowRemovals: false,
    status: 'IN_PROGRESS',
    noTimer: false,
    skipTime: new Date(Date.now() + 60000),
    currentPick: { round: 0, position: 0 },
    canDraft: [],
    canDraftCounts: {},
    logo: '',
    ...overrides,
  };
}

describe('LeagueManageDraftComponent', () => {
  let component: LeagueManageDraftComponent;
  let fixture: ComponentFixture<LeagueManageDraftComponent>;

  async function setup(details: PoolDetails) {
    await TestBed.configureTestingModule({
      imports: [LeagueManageDraftComponent],
      providers: [
        provideRouter([]),
        {
          provide: LeagueZoneService,
          useValue: {
            getPoolDetails: () => of(details),
            poolSlug: () => 'draft-1',
            leagueSlug: () => 'league-1',
            tournamentSlug: () => 'tournament-1',
            getLeagueInfo: () =>
              of({ pools: [{ name: 'Draft', poolSlug: 'draft-1' }] }),
          },
        },
        {
          provide: LeagueManageService,
          useValue: {
            setDraftState: () => of({}),
            setNoTimer: () => of({}),
            skipCurrentPick: () => of({}),
          },
        },
        {
          provide: TierListService,
          useValue: { getTierList: () => of({ tierList: [] }) },
        },
        {
          provide: LeagueNotificationService,
          useValue: {
            show: () => {},
            dismiss: () => {},
            notifications$: EMPTY,
          },
        },
        {
          provide: EventStreamService,
          useValue: { on: () => EMPTY },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueManageDraftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function statusDetailText(): string {
    return (
      fixture.debugElement.query(By.css('.page-header__status-detail'))
        ?.nativeElement as HTMLElement | undefined
    )?.textContent ?? '';
  }

  function statusBadgeText(): string {
    return (
      fixture.debugElement.query(By.css('.page-header__status-badge'))
        .nativeElement as HTMLElement
    ).textContent ?? '';
  }

  it('should create', async () => {
    await setup(makeDetails());
    expect(component).toBeTruthy();
  });

  it('shows a live countdown that ticks down every second while a pick is on the clock', async () => {
    await setup(
      makeDetails({
        currentPick: {
          round: 0,
          position: 0,
          skipTime: new Date(Date.now() + 5000),
        },
      }),
    );

    expect(statusDetailText()).toContain('Team One is on the clock');
    expect(statusDetailText()).toMatch(/\d+s left/);

    const firstReading = component.pickTimeDisplay;

    await wait(1100);
    fixture.detectChanges();

    expect(component.pickTimeDisplay).not.toBe(firstReading);
  });

  it('shows "timer disabled" instead of a countdown when noTimer is on', async () => {
    await setup(
      makeDetails({
        noTimer: true,
        currentPick: { round: 0, position: 0, skipTime: undefined },
      }),
    );

    expect(statusDetailText()).toContain('timer disabled');
    expect(component.pickTimeDisplay).toBeNull();
  });

  it('shows a paused message and no countdown when the draft is paused', async () => {
    await setup(
      makeDetails({
        status: 'PAUSED',
        currentPick: { round: 0, position: 0, skipTime: undefined },
      }),
    );

    expect(statusBadgeText()).toContain('Paused');
    expect(statusDetailText()).toContain('Clock is stopped');
  });

  it('shows "Draft complete" once the draft finishes', async () => {
    await setup(
      makeDetails({
        status: 'COMPLETED',
        currentPick: { round: 0, position: 0, skipTime: undefined },
      }),
    );

    expect(statusBadgeText()).toContain('Draft complete');
  });

  describe('pick editor taken list', () => {
    const pikachu = { id: 'pikachu', name: 'Pikachu' } as League.LeaguePokemon;
    const eevee = { id: 'eevee', name: 'Eevee' } as League.LeaguePokemon;
    const drafted = [
      { ...teams[0], draft: [pikachu] },
      { ...teams[1], draft: [eevee] },
    ];

    function turnFor(teamIndex: number) {
      return component.rounds[1].turns.find(
        (turn) => turn.team.id === drafted[teamIndex].id,
      )!;
    }

    it('offers nothing another team holds when duplicates are off', async () => {
      await setup(makeDetails({ teams: drafted }));

      expect(component.takenIdsFor(turnFor(1)).sort()).toEqual([
        'eevee',
        'pikachu',
      ]);
    });

    it('only withholds the team’s own picks when duplicates are allowed', async () => {
      await setup(makeDetails({ teams: drafted, allowDuplicates: true }));

      expect(component.takenIdsFor(turnFor(1))).toEqual(['eevee']);
    });
  });
});
