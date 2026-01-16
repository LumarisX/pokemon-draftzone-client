import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeagueDraftComponent } from './league-drafting.component';
import { LeagueZoneService } from '../../services/leagues/league-zone.service';
import { LeagueNotificationService } from '../../services/league-notification.service';
import { WebSocketService } from '../../services/ws.service';
import { of } from 'rxjs';

describe('LeagueDraftComponent', () => {
  let component: LeagueDraftComponent;
  let fixture: ComponentFixture<LeagueDraftComponent>;
  let mockLeagueService: jasmine.SpyObj<LeagueZoneService>;
  let mockNotificationService: jasmine.SpyObj<LeagueNotificationService>;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;

  beforeEach(async () => {
    mockLeagueService = jasmine.createSpyObj('LeagueZoneService', [
      'getDivisionDetails',
      'setPicks',
      'draftPokemon',
      'divisionKey',
    ]);
    mockNotificationService = jasmine.createSpyObj(
      'LeagueNotificationService',
      ['show'],
    );
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', ['on']);

    mockLeagueService.getDivisionDetails.and.returnValue(
      of({
        teams: [],
        leagueName: 'Test League',
        divisionName: 'Test Division',
        currentPick: undefined,
        canDraft: [],
        draftStyle: 'snake' as const,
        points: 100,
        rounds: 3,
        teamOrder: [],
        status: 'PRE_DRAFT' as const,
      }),
    );

    mockWebSocketService.on.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [LeagueDraftComponent],
      providers: [
        { provide: LeagueZoneService, useValue: mockLeagueService },
        {
          provide: LeagueNotificationService,
          useValue: mockNotificationService,
        },
        { provide: WebSocketService, useValue: mockWebSocketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueDraftComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load division details on init', () => {
    fixture.detectChanges();
    expect(mockLeagueService.getDivisionDetails).toHaveBeenCalled();
    expect(component.leagueName).toBe('Test League');
    expect(component.divisionName).toBe('Test Division');
    expect(component.isLoading).toBe(false);
  });

  it('should toggle dropdown', () => {
    component.isDropdownOpen = false;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(true);
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should select team and close dropdown', () => {
    const testTeam = { id: '1', name: 'Team A' } as any;
    component.isDropdownOpen = true;
    component.selectTeamAndClose(testTeam);
    expect(component.selectedTeam).toBe(testTeam);
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should calculate timeUntil correctly', () => {
    const futureTime = new Date(Date.now() + 5000);
    const result = component.timeUntil(futureTime);
    expect(result).toMatch(/[0-4]s/);
  });

  it('should return null for timeUntil with no time', () => {
    expect(component.timeUntil(undefined)).toBeNull();
  });

  it('should clean up subscriptions on destroy', () => {
    fixture.detectChanges();
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should return correct buttonText when drafting', () => {
    component.selectedTeam = {
      id: '1',
      picks: [[{ id: '1', name: 'Pikachu', tier: '1' }]],
      draft: [],
      isCoach: true,
    } as any;
    component.selectedPick = 0;
    expect(component.buttonText()).toBe('Draft');
  });

  it('should return undefined buttonText when no picks', () => {
    component.selectedTeam = { picks: [], draft: [] } as any;
    expect(component.buttonText()).toBeUndefined();
  });

  it('should return canDraft true when user is coach and in canDraftTeams', () => {
    component.selectedTeam = { id: '1', isCoach: true } as any;
    component.canDraftTeams = ['1'];
    expect(component.canDraft()).toBe(true);
  });

  it('should return canDraft false when user is not coach', () => {
    component.selectedTeam = { id: '1', isCoach: false } as any;
    component.canDraftTeams = ['1'];
    expect(component.canDraft()).toBe(false);
  });

  it('should return canDraft false when not in canDraftTeams', () => {
    component.selectedTeam = { id: '1', isCoach: true } as any;
    component.canDraftTeams = ['2'];
    expect(component.canDraft()).toBe(false);
  });
});
