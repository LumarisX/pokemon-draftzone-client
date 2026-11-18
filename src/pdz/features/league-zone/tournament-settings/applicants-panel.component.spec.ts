import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { LeagueManageService } from '../league-manage/league-manage.service';
import { LeagueZoneService } from '../league-zone.service';
import { ApplicantsPanelComponent } from './applicants-panel.component';
import { SignUpValue } from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

function applicant(overrides: Partial<SignUpValue>): SignUpValue {
  return {
    id: null,
    applicationId: 'a1',
    intent: 'team',
    answers: [],
    teamId: null,
    teamSlug: null,
    logo: null,
    status: 'pending',
    departed: false,
    teamName: 'Vipers',
    coach: 'Misty',
    showdownName: 'mistyw',
    discordName: 'misty#1',
    timezone: 'UTC',
    experience: '',
    signedUpAt: '',
    inDiscordServer: false,
    hasDiscordRole: false,
    ...overrides,
  };
}

describe('ApplicantsPanelComponent profile links', () => {
  function render(signUps: SignUpValue[]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideAuthStub(),
        {
          provide: TournamentSettingsStore,
          useValue: {
            signUps: signal(signUps),
            pools: signal([]),
            applicantsDirtyCount: signal(0),
            saving: signal(false),
          },
        },
        {
          provide: LeagueZoneService,
          useValue: { leagueSlug: () => 'spring', tournamentSlug: () => 'one' },
        },
        { provide: LeagueManageService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(ApplicantsPanelComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('links an applicant to their profile when it has an id', () => {
    const fixture = render([
      applicant({
        applicationId: 'a1',
        coach: 'Misty',
        profileId: 'a1b2c3d4e5f6a1b2c3d4e5f6',
      }),
      applicant({ applicationId: 'a2', coach: 'Brock' }),
    ]);
    const lines = Array.from(
      fixture.nativeElement.querySelectorAll('.app__line'),
    ) as HTMLElement[];
    expect(lines).toHaveLength(2);
    expect(lines[0].querySelector('a')?.getAttribute('href')).toBe(
      '/profile/a1b2c3d4e5f6a1b2c3d4e5f6',
    );
    expect(lines[1].textContent).toContain('Brock');
    expect(lines[1].querySelector('a')).toBeNull();
  });
});
