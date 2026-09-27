import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { UploadService } from '@pdz/core/services/upload.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { League } from '../league.interface';
import { LeagueEditComponent } from './league-edit.component';

function summary(
  overrides: Partial<League.LeagueSummary> = {},
): League.LeagueSummary {
  return {
    name: 'Spring League',
    leagueSlug: 'league01',
    description: 'Seasons of spring',
    logo: 'league-logos/spring.png',
    tournaments: [],
    isOwner: true,
    newTournamentDefaults: null,
    hosting: null,
    ...overrides,
  };
}

describe('LeagueEditComponent', () => {
  let updateLeague: jest.Mock;
  let navigate: jest.Mock;

  function setup(league = summary()) {
    updateLeague = jest.fn().mockReturnValue(of({ message: 'ok' }));
    navigate = jest.fn();

    TestBed.configureTestingModule({
      imports: [LeagueEditComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ leagueSlug: 'league01' }) },
          },
        },
        {
          provide: LeagueZoneService,
          useValue: { getLeague: () => of(league), updateLeague },
        },
        { provide: UploadService, useValue: {} },
        {
          provide: ToastService,
          useValue: { success: jest.fn(), error: jest.fn() },
        },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(LeagueEditComponent);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      name: { set(value: string): void };
      description: { set(value: string): void };
      logo: { set(value: string | null): void };
      canSubmit: () => boolean;
      submit(): void;
    };
  }

  it('has nothing to save until a field changes', () => {
    const component = setup();
    expect(component.canSubmit()).toBe(false);

    component.name.set(' Spring League ');
    expect(component.canSubmit()).toBe(false);
  });

  it('sends only the fields that changed', () => {
    const component = setup();
    component.name.set('Autumn League');
    component.logo.set(null);

    component.submit();

    expect(updateLeague).toHaveBeenCalledWith('league01', {
      name: 'Autumn League',
      logo: null,
    });
    expect(navigate).toHaveBeenCalledWith(['/', 'leagues', 'league01']);
  });

  it('refuses a blank name', () => {
    const component = setup();
    component.name.set('   ');
    expect(component.canSubmit()).toBe(false);
  });
});
