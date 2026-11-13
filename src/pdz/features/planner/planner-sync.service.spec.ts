import { TestBed } from '@angular/core/testing';
import { ApiService } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of, throwError } from 'rxjs';
import { mergePlans, PlannerSyncService } from './planner-sync.service';

const KEY = 'plannerData';
const META = `${KEY}:sync`;

const plan = (name: string, ids: string[] = ['pikachu']) => ({
  draftName: name,
  team: ids.map((id) => ({ id, tier: 'A', value: 1 })),
});

describe('mergePlans', () => {
  it('adds plans only this device has', () => {
    expect(mergePlans([plan('Rain')], [plan('Sun')]).map((p) => p.draftName)).toEqual(
      ['Rain', 'Sun'],
    );
  });

  it('skips plans that are already the same on the server and empty ones', () => {
    expect(mergePlans([plan('Rain')], [plan('Rain'), plan('Blank', [])])).toEqual([
      plan('Rain'),
    ]);
  });

  it('keeps both versions when a plan with the same name differs', () => {
    const merged = mergePlans([plan('Rain')], [plan('Rain', ['kyogre'])]);

    expect(merged.map((p) => p.draftName)).toEqual([
      'Rain',
      'Rain (This Device)',
    ]);
  });

  it('never holds more than nine plans', () => {
    const server = Array.from({ length: 8 }, (_, i) => plan(`S${i}`));
    const local = [plan('L1'), plan('L2')];

    expect(mergePlans(server, local)).toHaveLength(9);
  });
});

describe('PlannerSyncService', () => {
  let api: { get: jest.Mock; put: jest.Mock };
  let toast: { error: jest.Mock };

  function create(authenticated = true) {
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: of(authenticated),
            user$: of(authenticated ? { sub: 'auth0|me' } : null),
          },
        },
      ],
    });
    return TestBed.inject(PlannerSyncService);
  }

  function reconcile(service: PlannerSyncService) {
    let done = false;
    service.reconcile(KEY).subscribe(() => (done = true));
    expect(done).toBe(true);
  }

  beforeEach(() => {
    localStorage.clear();
    api = {
      get: jest.fn().mockReturnValue(of({ plans: null, revision: 0 })),
      put: jest.fn().mockReturnValue(of({ revision: 1 })),
    };
    toast = { error: jest.fn() };
  });

  it('never calls the server when signed out', () => {
    const service = create(false);
    localStorage.setItem(KEY, JSON.stringify([plan('Rain')]));

    reconcile(service);
    service.push(KEY, JSON.stringify([plan('Rain')]));

    expect(api.get).not.toHaveBeenCalled();
    expect(api.put).not.toHaveBeenCalled();
  });

  it("uploads this browser's plans the first time an account has none", () => {
    const local = JSON.stringify([plan('Rain')]);
    localStorage.setItem(KEY, local);

    reconcile(create());

    expect(api.put).toHaveBeenCalledWith('planner/plans', {
      key: KEY,
      revision: 0,
      plans: [plan('Rain')],
    });
    expect(JSON.parse(localStorage.getItem(META)!)).toEqual({
      sub: 'auth0|me',
      revision: 1,
      json: local,
    });
  });

  it("takes the account's plans on a device that has none", () => {
    api.get.mockReturnValue(of({ plans: [plan('Sun')], revision: 4 }));

    reconcile(create());

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([plan('Sun')]);
    expect(api.put).not.toHaveBeenCalled();
  });

  it('keeps both when the account and this device each have plans', () => {
    localStorage.setItem(KEY, JSON.stringify([plan('Rain')]));
    api.get.mockReturnValue(of({ plans: [plan('Sun')], revision: 4 }));
    api.put.mockReturnValue(of({ revision: 5 }));

    reconcile(create());

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([
      plan('Sun'),
      plan('Rain'),
    ]);
    expect(api.put).toHaveBeenCalledWith(
      'planner/plans',
      expect.objectContaining({ revision: 4, plans: [plan('Sun'), plan('Rain')] }),
    );
  });

  it('replaces unchanged local plans when the account moved on', () => {
    const synced = JSON.stringify([plan('Rain')]);
    localStorage.setItem(KEY, synced);
    localStorage.setItem(
      META,
      JSON.stringify({ sub: 'auth0|me', revision: 2, json: synced }),
    );
    api.get.mockReturnValue(of({ plans: [plan('Sun')], revision: 3 }));

    reconcile(create());

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([plan('Sun')]);
    expect(api.put).not.toHaveBeenCalled();
  });

  it('opens the planner on local plans when the server does not answer', () => {
    const local = JSON.stringify([plan('Rain')]);
    localStorage.setItem(KEY, local);
    api.get.mockReturnValue(throwError(() => new Error('offline')));

    reconcile(create());

    expect(localStorage.getItem(KEY)).toBe(local);
  });

  it('saves edits against the revision it last saw', () => {
    const service = create();
    api.get.mockReturnValue(of({ plans: [plan('Sun')], revision: 4 }));
    reconcile(service);
    api.put.mockReturnValue(of({ revision: 5 }));

    service.push(KEY, JSON.stringify([plan('Sun'), plan('Hail')]));

    expect(api.put).toHaveBeenCalledWith('planner/plans', {
      key: KEY,
      revision: 4,
      plans: [plan('Sun'), plan('Hail')],
    });
  });

  it('merges and tells the planner when another device saved first', () => {
    const service = create();
    reconcile(service);
    const merged: string[] = [];
    service.merged.subscribe((key) => merged.push(key));
    const mine = JSON.stringify([plan('Rain')]);
    localStorage.setItem(KEY, mine);
    api.put
      .mockReturnValueOnce(throwError(() => ({ status: 409 })))
      .mockReturnValueOnce(of({ revision: 8 }));
    api.get.mockReturnValue(of({ plans: [plan('Sun')], revision: 7 }));

    service.push(KEY, mine);

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([
      plan('Sun'),
      plan('Rain'),
    ]);
    expect(api.put).toHaveBeenLastCalledWith(
      'planner/plans',
      expect.objectContaining({ revision: 7 }),
    );
    expect(merged).toEqual([KEY]);
  });

  it('says once that the account save failed', () => {
    const service = create();
    reconcile(service);
    api.put.mockReturnValue(throwError(() => new Error('down')));

    service.push(KEY, JSON.stringify([plan('Rain')]));
    service.push(KEY, JSON.stringify([plan('Rain'), plan('Sun')]));

    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

jest.mock('@pdz/core/services/api-error', () => ({
  toApiError: jest.fn((error: { status?: number }) =>
    typeof error?.status === 'number' ? { status: error.status } : undefined,
  ),
}));
