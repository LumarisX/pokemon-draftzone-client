import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { of } from 'rxjs';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { LeagueOrganizersComponent } from './league-organizers.component';

describe('LeagueOrganizersComponent profile links', () => {
  function render(organizers: League.TournamentOrganizer[]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideAuthStub(),
        {
          provide: LeagueZoneService,
          useValue: {
            leagueSlug: () => 'spring',
            tournamentSlug: () => 'one',
            getOrganizers: () =>
              of({ canEdit: false, organizers, invites: [], candidates: [] }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(LeagueOrganizersComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('links an organizer to their profile when it has an id', () => {
    const fixture = render([
      {
        sub: 'a',
        name: 'Oak',
        profileId: 'a1b2c3d4e5f6a1b2c3d4e5f6',
        isOwner: true,
        isYou: false,
      },
      { sub: 'b', name: 'Elm', isOwner: false, isYou: false },
    ]);
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.person__name a.person__link'),
    ).map((element) => (element as HTMLElement).getAttribute('href'));
    expect(links).toEqual(['/profile/a1b2c3d4e5f6a1b2c3d4e5f6']);
  });
});
