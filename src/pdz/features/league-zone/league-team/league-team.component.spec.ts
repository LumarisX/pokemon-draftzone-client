import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { NEVER, of } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LeagueTeamComponent } from './league-team.component';

function team(overrides: Partial<League.LeagueTeam> = {}): League.LeagueTeam {
  return {
    id: 't1',
    slug: 'vipers',
    name: 'Viridian Vipers',
    coach: 'Misty',
    draft: [],
    picks: [],
    isCoach: false,
    pointTotal: 100,
    ...overrides,
  };
}

function render(data: League.LeagueTeam) {
  const stub = new Proxy(
    {
      leagueSlug: () => 'spring',
      tournamentSlug: () => 'one',
      listStages: () => of([]),
      getTeam: () => of(data),
    } as Record<string, unknown>,
    { get: (target, key: string) => target[key] ?? (() => NEVER) },
  );

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideAuthStub(),
      { provide: LeagueZoneService, useValue: stub },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap({ teamSlug: 'vipers' })),
          snapshot: { paramMap: convertToParamMap({ teamSlug: 'vipers' }) },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(LeagueTeamComponent);
  fixture.detectChanges();
  return fixture;
}

describe('LeagueTeamComponent coach line', () => {
  it('links the coach name to their profile', () => {
    const fixture = render(team({ coachProfileId: 'a1b2c3d4e5f6a1b2c3d4e5f6' }));
    const link = fixture.nativeElement.querySelector(
      '.team-header__coach a.team-header__coach-name',
    );
    expect(link.textContent.trim()).toBe('Misty');
    expect(link.getAttribute('href')).toBe('/profile/a1b2c3d4e5f6a1b2c3d4e5f6');
  });

  it('shows the coach name as plain text without a profile', () => {
    const fixture = render(team());
    const line = fixture.nativeElement.querySelector('.team-header__coach');
    expect(line.textContent).toContain('Misty');
    expect(line.querySelector('a.team-header__coach-name')).toBeNull();
  });

  it('shows the coach Discord name with the Discord icon when it is sent', () => {
    const fixture = render(team({ coachDiscordName: 'misty_w' }));
    const discord = fixture.nativeElement.querySelector(
      '.team-header__coach .team-header__discord',
    );
    expect(discord.textContent).toContain('misty_w');
    expect(discord.querySelector('pdz-icon')).not.toBeNull();
  });

  it('shows no Discord line when the name is not sent', () => {
    const fixture = render(team());
    expect(
      fixture.nativeElement.querySelector('.team-header__discord'),
    ).toBeNull();
  });
});
