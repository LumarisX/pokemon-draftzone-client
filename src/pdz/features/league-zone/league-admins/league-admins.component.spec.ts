import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { Observable, of, throwError } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LeagueAdminsComponent } from './league-admins.component';

function admins(overrides: Partial<League.LeagueAdmins> = {}): League.LeagueAdmins {
  return {
    canEdit: true,
    ownerIsYou: true,
    admins: [{ sub: 'auth0|brock', name: 'Brock', isYou: false }],
    invites: [],
    ...overrides,
  };
}

describe('LeagueAdminsComponent', () => {
  let service: Record<string, jest.Mock>;
  let navigate: jest.Mock;

  function setup(
    adminsResult: Observable<League.LeagueAdmins> = of(admins()),
  ) {
    navigate = jest.fn();
    service = {
      getLeague: jest.fn().mockReturnValue(of({ name: 'Spring League' })),
      getLeagueAdmins: jest.fn().mockReturnValue(adminsResult),
      createLeagueAdminInvite: jest.fn().mockReturnValue(
        of({ ...admins(), created: { id: 'invite1', token: 'secret' } }),
      ),
      removeLeagueAdmin: jest.fn().mockReturnValue(of({ left: true })),
    };

    TestBed.configureTestingModule({
      imports: [LeagueAdminsComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ leagueSlug: 'spring' }) },
          },
        },
        { provide: LeagueZoneService, useValue: service },
        { provide: DialogService, useValue: { confirm: async () => true } },
        { provide: ToastService, useValue: { success: jest.fn(), error: jest.fn() } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(LeagueAdminsComponent);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance as unknown as {
        state: () => string;
        createdLink: () => { url: string } | null;
        inviteName: { set(value: string): void };
        createInvite(): void;
        remove(admin: League.LeagueAdmin): Promise<void>;
      },
    };
  }

  it('shows the owner the invite form', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.textContent).toContain('Invite by Link');
    expect(fixture.nativeElement.textContent).toContain('Brock');
  });

  it('hides the invite form from an admin', () => {
    const { fixture } = setup(
      of(admins({ canEdit: false, ownerIsYou: false })),
    );
    expect(fixture.nativeElement.textContent).not.toContain('Invite by Link');
  });

  it('shows no-access to someone outside the league', () => {
    const { component } = setup(
      throwError(
        () =>
          new ApiError(
            new HttpErrorResponse({ status: 403, statusText: 'Forbidden' }),
          ),
      ),
    );
    expect(component.state()).toBe('forbidden');
  });

  it('builds the invite link from the one-time token', () => {
    const { component } = setup();
    component.inviteName.set('Misty');

    component.createInvite();

    expect(service['createLeagueAdminInvite']).toHaveBeenCalledWith(
      'spring',
      'Misty',
    );
    expect(component.createdLink()?.url).toContain(
      '/leagues/spring/admin-invite?token=secret',
    );
  });

  it('sends an admin who leaves back to the league', async () => {
    const { component } = setup(
      of(
        admins({
          canEdit: false,
          ownerIsYou: false,
          admins: [{ sub: 'auth0|me', name: 'Me', isYou: true }],
        }),
      ),
    );

    await component.remove({ sub: 'auth0|me', name: 'Me', isYou: true });

    expect(navigate).toHaveBeenCalledWith(['/', 'leagues', 'spring']);
  });
});
