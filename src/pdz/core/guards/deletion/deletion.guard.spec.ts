import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { Observable, of } from 'rxjs';
import { deletionGuard } from './deletion.guard';

function run(me: Partial<Me> | null, url: string): Promise<boolean | UrlTree> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: RoleService, useValue: { me$: of(me) } },
    ],
  });
  const result = TestBed.runInInjectionContext(() =>
    deletionGuard(
      {} as ActivatedRouteSnapshot,
      { url } as RouterStateSnapshot,
    ),
  ) as Observable<boolean | UrlTree>;
  return new Promise((resolve) => result.subscribe(resolve));
}

describe('deletionGuard', () => {
  const scheduled = { deletionScheduledFor: '2026-12-20T12:00:00.000Z' };

  it('lets a signed-out visitor through', async () => {
    expect(await run(null, '/dashboard')).toBe(true);
  });

  it('lets an account with no deletion through', async () => {
    expect(await run({ deletionScheduledFor: null }, '/dashboard')).toBe(true);
  });

  it('sends a scheduled account to the deletion page', async () => {
    const result = await run(scheduled, '/leagues/pdbl');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/settings/deletion',
    );
  });

  it.each([
    '/settings/deletion',
    '/settings/deletion?x=1',
    '/privacy',
    '/terms#data',
  ])('lets a scheduled account reach %s', async (url) => {
    expect(await run(scheduled, url)).toBe(true);
  });

  it('still redirects settings itself', async () => {
    expect(await run(scheduled, '/settings')).toBeInstanceOf(UrlTree);
  });
});
