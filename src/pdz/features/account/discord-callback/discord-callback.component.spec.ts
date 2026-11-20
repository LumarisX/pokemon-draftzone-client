import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { NEVER, of, throwError } from 'rxjs';
import {
  DISCORD_ERROR,
  DiscordConnectionService,
} from '../discord-connection.service';
import { DiscordCallbackComponent } from './discord-callback.component';

const me = { sub: 'auth0|1' } as Me;

function failure(code: string, status: number, details?: object): ApiError {
  return new ApiError(
    new HttpErrorResponse({
      status,
      error: { error: { code, message: 'server text', details } },
    }),
  );
}

describe('DiscordCallbackComponent', () => {
  let complete: jest.Mock;
  let merge: jest.Mock;
  let begin: jest.Mock;
  let go: jest.Mock;
  let confirm: jest.Mock;
  let setMe: jest.Mock;
  let navigateByUrl: jest.SpyInstance;
  let navigate: jest.SpyInstance;

  function render(query: Record<string, string>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: DiscordConnectionService,
          useValue: { complete, merge, begin, go },
        },
        { provide: DialogService, useValue: { confirm } },
        { provide: RoleService, useValue: { setMe } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    const router = TestBed.inject(Router);
    navigateByUrl = jest
      .spyOn(router, 'navigateByUrl')
      .mockResolvedValue(true);
    navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DiscordCallbackComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    complete = jest.fn(() => of({ me, returnTo: '/leagues/spring/sign-up' }));
    merge = jest.fn(() => of({ me }));
    begin = jest.fn(() => of({ url: 'https://discord.test/authorize' }));
    go = jest.fn();
    confirm = jest.fn(() => Promise.resolve(true));
    setMe = jest.fn();
  });

  it('posts the code and state once and returns to returnTo', () => {
    const fixture = render({ code: 'abc', state: 'xyz' });
    fixture.detectChanges();
    fixture.detectChanges();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledWith('abc', 'xyz');
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/leagues/spring/sign-up', {
      replaceUrl: true,
    });
  });

  it('shows a skeleton while posting', () => {
    complete.mockReturnValue(NEVER);
    const fixture = render({ code: 'abc', state: 'xyz' });
    expect(
      fixture.nativeElement.querySelector('pdz-skeleton-layout'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('pdz-empty-state')).toBeNull();
  });

  it('goes straight back to settings when cancelled, without posting', () => {
    render({ error: 'access_denied', state: 'xyz' });
    expect(complete).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/', 'settings'], {
      replaceUrl: true,
    });
  });

  it('treats a missing code as an expired approval without posting', () => {
    const fixture = render({ state: 'xyz' });
    expect(complete).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('expired');
  });

  it.each([
    [DISCORD_ERROR.stateInvalid, 400, 'expired'],
    [DISCORD_ERROR.exchangeFailed, 502, "didn't confirm the connection"],
    [DISCORD_ERROR.notConfigured, 503, "isn't set up"],
    ['USR-999', 500, 'Something went wrong'],
  ])('explains %s', (code, status, text) => {
    complete.mockReturnValue(throwError(() => failure(code, status)));
    const fixture = render({ code: 'abc', state: 'xyz' });
    const state = fixture.nativeElement.querySelector('pdz-empty-state');
    expect(state.textContent).toContain(text);
    const link = state.querySelector('a');
    expect(link.textContent).toContain('Back to Settings');
    expect(link.getAttribute('href')).toBe('/settings');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it.each([
    ['discord', 'sign in to with Discord. Sign in that way instead.'],
    ['google', 'sign in to with Google. Sign in with Google instead.'],
    ['email', 'sign in to with email. Sign in with email instead.'],
    ['other', 'another DraftZone account. Sign in to that account instead.'],
  ])('names the %s holder when already connected', (heldBy, text) => {
    complete.mockReturnValue(
      throwError(() =>
        failure(DISCORD_ERROR.alreadyConnected, 409, { heldBy }),
      ),
    );
    const fixture = render({ code: 'abc', state: 'xyz' });
    const state = fixture.nativeElement.querySelector('pdz-empty-state');
    expect(state.textContent).toContain(
      'That Discord account is already connected to',
    );
    expect(state.textContent).toContain(text);
  });

  it('keeps the old message when the conflict carries no merge offer', () => {
    complete.mockReturnValue(
      throwError(() =>
        failure(DISCORD_ERROR.alreadyConnected, 409, { heldBy: 'google' }),
      ),
    );
    const fixture = render({ code: 'abc', state: 'xyz' });
    expect(fixture.nativeElement.querySelector('.merge')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'already connected to',
    );
  });

  describe('merge offer', () => {
    const counts = {
      teams: 0,
      leagues: 0,
      tournaments: 0,
      drafts: 0,
      tierLists: 0,
      plans: 0,
    };

    function offer(over: Record<string, unknown> = {}) {
      return {
        token: 'tok',
        expiresAt: '2026-11-17T12:00:00.000Z',
        current: {
          profileId: 'p1',
          displayName: 'Ash',
          joined: '2026-01-15T00:00:00.000Z',
          signInMethod: 'google',
          counts: { ...counts, teams: 1 },
        },
        other: {
          profileId: 'p2',
          displayName: 'Red',
          joined: '2025-06-10T00:00:00.000Z',
          signInMethod: 'discord',
          counts: { ...counts, teams: 2, tierLists: 1 },
        },
        blockers: [],
        ...over,
      };
    }

    function renderOffer(over: Record<string, unknown> = {}) {
      complete.mockReturnValue(
        throwError(() =>
          failure(DISCORD_ERROR.alreadyConnected, 409, {
            mergeOffer: offer(over),
          }),
        ),
      );
      return render({ code: 'abc', state: 'xyz' });
    }

    function text(fixture: { nativeElement: HTMLElement }): string {
      return fixture.nativeElement.textContent ?? '';
    }

    async function clickMerge(fixture: {
      nativeElement: HTMLElement;
      detectChanges(): void;
      whenStable(): Promise<unknown>;
    }) {
      const button = Array.from(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b) => b.textContent?.includes('Merge Accounts'))!;
      button.click();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('shows both accounts, hides zero counts and defaults to the larger', () => {
      const fixture = renderOffer();
      const body = text(fixture);
      expect(body).toContain('Ash');
      expect(body).toContain('Red');
      expect(body).toContain('Signs in with Google');
      expect(body).toContain('Signs in with Discord');
      expect(body).toContain('Signed in now');
      expect(body).toContain('1 team');
      expect(body).toContain('2 teams');
      expect(body).toContain('1 tier list');
      expect(body).not.toContain('0 ');
      expect(body).not.toContain('Nothing yet');
      const radios = fixture.nativeElement.querySelectorAll('[role="radio"]');
      expect(radios[0].getAttribute('aria-checked')).toBe('false');
      expect(radios[1].getAttribute('aria-checked')).toBe('true');
    });

    it('defaults to the current account on a tie and says Nothing yet', () => {
      const fixture = renderOffer({
        other: {
          ...offer().other,
          counts: { ...counts },
        },
        current: { ...offer().current, counts: { ...counts } },
      });
      const radios = fixture.nativeElement.querySelectorAll('[role="radio"]');
      expect(radios[0].getAttribute('aria-checked')).toBe('true');
      expect(text(fixture)).toContain('Nothing yet');
    });

    it('hides the merge button and lists blockers', () => {
      const fixture = renderOffer({ blockers: ['Both coach in Spring Cup'] });
      expect(text(fixture)).toContain('Both coach in Spring Cup');
      expect(text(fixture)).not.toContain('Merge Accounts');
      expect(text(fixture)).toContain('Not Now');
    });

    it('does nothing when the confirm is declined', async () => {
      confirm.mockResolvedValue(false);
      const fixture = renderOffer();
      await clickMerge(fixture);
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(merge).not.toHaveBeenCalled();
    });

    it('merges with the chosen account, sets Me and goes to settings', async () => {
      const fixture = renderOffer();
      await clickMerge(fixture);
      expect(merge).toHaveBeenCalledWith('tok', 'other');
      expect(setMe).toHaveBeenCalledWith(me);
      expect(navigate).toHaveBeenCalledWith(['/', 'settings'], {
        replaceUrl: true,
      });
    });

    it('offers to connect again when the offer expired', async () => {
      merge.mockReturnValue(
        throwError(() => failure(DISCORD_ERROR.mergeOfferInvalid, 400)),
      );
      const fixture = renderOffer();
      await clickMerge(fixture);
      expect(text(fixture)).toContain('expired');
      const again = Array.from<HTMLButtonElement>(
        fixture.nativeElement.querySelectorAll('button'),
      ).find((b) => b.textContent?.includes('Connect Discord'))!;
      again.click();
      expect(begin).toHaveBeenCalledWith('/settings');
      expect(go).toHaveBeenCalledWith('https://discord.test/authorize');
    });

    it('shows returned blockers and no button when blocked', async () => {
      merge.mockReturnValue(
        throwError(() =>
          failure(DISCORD_ERROR.mergeBlocked, 409, {
            blockers: ['Both applied to Fall Open'],
          }),
        ),
      );
      const fixture = renderOffer();
      await clickMerge(fixture);
      expect(text(fixture)).toContain('Both applied to Fall Open');
      expect(text(fixture)).not.toContain('Merge Accounts');
    });

    it('shows an error state when merging is unavailable', async () => {
      merge.mockReturnValue(
        throwError(() => failure(DISCORD_ERROR.mergeUnavailable, 503)),
      );
      const fixture = renderOffer();
      await clickMerge(fixture);
      const state = fixture.nativeElement.querySelector('pdz-empty-state');
      expect(state).not.toBeNull();
      expect(state.querySelector('a').textContent).toContain(
        'Back to Settings',
      );
      expect(setMe).not.toHaveBeenCalled();
    });
  });
});
