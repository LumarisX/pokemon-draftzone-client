import { TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { EventStreamService, RETRY_BASE_MS } from './event-stream.service';

const PATH = 'leagues/pdz/tournaments/spring-cup/draft-events';

function streamResponse(chunks: string[], { status = 200, open = true } = {}) {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => ({
        read: () => {
          if (index < chunks.length)
            return Promise.resolve({
              value: encoder.encode(chunks[index++]),
              done: false,
            });
          return open
            ? new Promise(() => undefined)
            : Promise.resolve({ value: undefined, done: true });
        },
      }),
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('EventStreamService', () => {
  let authenticated$: BehaviorSubject<boolean>;
  let getAccessTokenSilently: jest.Mock;
  let fetchMock: jest.Mock;
  let setTimeoutSpy: jest.SpyInstance;
  let service: EventStreamService;

  beforeEach(() => {
    authenticated$ = new BehaviorSubject(false);
    getAccessTokenSilently = jest.fn(() => of('access-token'));
    fetchMock = jest.fn(async () => streamResponse([]));
    globalThis.fetch = fetchMock;
    setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { isAuthenticated$: authenticated$, getAccessTokenSilently },
        },
      ],
    });
    service = TestBed.inject(EventStreamService);
  });

  afterEach(() => {
    service.close();
    setTimeoutSpy.mockRestore();
  });

  function requestHeaders(call = 0): Record<string, string> {
    return fetchMock.mock.calls[call][1].headers;
  }

  function retryCallbacks(): (() => void)[] {
    return setTimeoutSpy.mock.calls
      .filter(([, delay]) => delay >= RETRY_BASE_MS)
      .map(([callback]) => callback);
  }

  it('connects without a token when signed out', async () => {
    service.open(PATH);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`/${PATH}$`));
    expect(requestHeaders()['Authorization']).toBeUndefined();
    expect(requestHeaders()['Accept']).toBe('text/event-stream');
  });

  it('sends the access token when signed in', async () => {
    authenticated$.next(true);
    service.open(PATH);
    await flush();

    expect(requestHeaders()['Authorization']).toBe('Bearer access-token');
  });

  it('connects anonymously when the token cannot be fetched', async () => {
    authenticated$.next(true);
    getAccessTokenSilently.mockReturnValue(
      throwError(() => new Error('login required')),
    );
    service.open(PATH);
    await flush();

    expect(requestHeaders()['Authorization']).toBeUndefined();
  });

  it('parses named events across chunk boundaries and skips comments', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        ': keepalive\n\nevent: league.draft.sta',
        'tus\ndata: {"poolSlug":"pool-a","status":"PAUSED"}\n\n',
        'event: league.draft.skip\ndata: {"teamName":"Team A"}\n\n',
      ]),
    );
    const statuses: unknown[] = [];
    const skips: unknown[] = [];
    service.on('league.draft.status').subscribe((data) => statuses.push(data));
    service.on('league.draft.skip').subscribe((data) => skips.push(data));

    service.open(PATH);
    await flush();

    expect(statuses).toEqual([{ poolSlug: 'pool-a', status: 'PAUSED' }]);
    expect(skips).toEqual([{ teamName: 'Team A' }]);
  });

  it('ignores an event whose data is not JSON', async () => {
    fetchMock.mockResolvedValue(
      streamResponse(['event: league.draft.skip\ndata: nope\n\n']),
    );
    const skips: unknown[] = [];
    service.on('league.draft.skip').subscribe((data) => skips.push(data));

    service.open(PATH);
    await flush();

    expect(skips).toEqual([]);
  });

  it('reconnects with a growing delay after the stream drops', async () => {
    fetchMock.mockImplementation(async () =>
      streamResponse([], { status: 503 }),
    );
    service.open(PATH);
    await flush();

    expect(setTimeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      RETRY_BASE_MS,
    );
    retryCallbacks()[0]();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      RETRY_BASE_MS * 2,
    );
  });

  it('reconnects after a stream the server closed', async () => {
    fetchMock.mockImplementation(async () =>
      streamResponse([], { open: false }),
    );
    service.open(PATH);
    await flush();

    expect(retryCallbacks()).toHaveLength(1);
  });

  it('gives up on a client error such as an unknown tournament', async () => {
    fetchMock.mockResolvedValue(streamResponse([], { status: 404 }));
    service.open(PATH);
    await flush();

    expect(retryCallbacks()).toHaveLength(0);
  });

  it('does not reconnect once closed', async () => {
    fetchMock.mockImplementation(async () =>
      streamResponse([], { status: 503 }),
    );
    service.open(PATH);
    await flush();
    service.close();

    retryCallbacks()[0]?.();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps one connection when the same path is opened again', async () => {
    service.open(PATH);
    service.open(PATH);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts the old stream and connects to a new path', async () => {
    service.open(PATH);
    await flush();
    const firstSignal: AbortSignal = fetchMock.mock.calls[0][1].signal;

    service.open('leagues/pdz/tournaments/autumn-cup/draft-events');
    await flush();

    expect(firstSignal.aborted).toBe(true);
    expect(fetchMock.mock.calls[1][0]).toContain('autumn-cup');
  });

  it('reconnects with the new identity on sign-in', async () => {
    service.open(PATH);
    await flush();

    authenticated$.next(true);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestHeaders(1)['Authorization']).toBe('Bearer access-token');
  });
});
