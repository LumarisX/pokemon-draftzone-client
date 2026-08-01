import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, EMPTY } from 'rxjs';
import { By } from '@angular/platform-browser';

import { LeagueManageDraftComponent } from './league-manage-draft.component';
import { LeagueZoneService } from '../../league-zone.service';
import { DraftDetails, LeagueManageService } from '../league-manage.service';
import { TierListService } from '../../../tier-lists/tier-list.service';
import { LeagueNotificationService } from '../../league-notification.service';
import { WebSocketService } from '@pdz/core/services/ws.service';
import { League } from '../../league.interface';

function makeTeam(id: string, name: string): League.LeagueTeam {
  return {
    id,
    name,
    coach: `${name} coach`,
    draft: [],
    picks: [],
    isCoach: false,
    pointTotal: 0,
  };
}

const teams = [makeTeam('t1', 'Team One'), makeTeam('t2', 'Team Two')];

function makeDetails(overrides: Partial<DraftDetails> = {}): DraftDetails {
  return {
    leagueName: 'League',
    draftName: 'Draft',
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
    visibility: 'ALL',
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

  async function setup(details: DraftDetails) {
    await TestBed.configureTestingModule({
      imports: [LeagueManageDraftComponent],
      providers: [
        {
          provide: LeagueZoneService,
          useValue: {
            getDraftDetails: () => of(details),
            draftSlug: () => 'draft-1',
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
          provide: WebSocketService,
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
});
