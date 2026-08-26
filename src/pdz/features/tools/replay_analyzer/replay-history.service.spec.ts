import { TestBed } from '@angular/core/testing';
import { ReplayHistoryService, replayIdFromURI } from './replay-history.service';
import { ReplayAnalysis } from './replay.interface';

const REPLAY_URI =
  'https://replay.pokemonshowdown.com/gen9championsvgc2026regmb-2669364000';

function analysis(
  players: { username: string; kills: number }[],
): ReplayAnalysis {
  return {
    gametype: 'doubles',
    genNum: 9,
    turns: 12,
    gameTime: 480,
    events: [],
    players: players.map(({ username, kills }) => ({
      username,
      win: false,
      stats: { switches: 0 },
      total: { kills, deaths: 0, damageDealt: 0, damageTaken: 0 },
      turnChart: [],
      luck: {
        moves: { total: 0, hits: 0, expected: 0, actual: 0 },
        crits: { total: 0, hits: 0, expected: 0, actual: 0 },
        status: { total: 0, full: 0, expected: 0, actual: 0 },
      },
      team: [],
    })),
  };
}

describe('replayIdFromURI', () => {
  it('takes the last path segment', () => {
    expect(replayIdFromURI(REPLAY_URI)).toBe(
      'gen9championsvgc2026regmb-2669364000',
    );
  });

  it('ignores a trailing slash, query string and hash', () => {
    expect(replayIdFromURI(`${REPLAY_URI}/?p2#turn3`)).toBe(
      'gen9championsvgc2026regmb-2669364000',
    );
  });

  it('drops a .json or .log suffix', () => {
    expect(replayIdFromURI(`${REPLAY_URI}.json`)).toBe(
      'gen9championsvgc2026regmb-2669364000',
    );
  });
});

describe('ReplayHistoryService', () => {
  let service: ReplayHistoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReplayHistoryService);
  });

  it('records the players and their kill counts', () => {
    service.record(
      REPLAY_URI,
      analysis([
        { username: 'Player 1', kills: 3 },
        { username: 'Player 2', kills: 1 },
      ]),
    );

    expect(service.entries()).toEqual([
      expect.objectContaining({
        uri: REPLAY_URI,
        id: 'gen9championsvgc2026regmb-2669364000',
        players: ['Player 1', 'Player 2'],
        score: [3, 1],
      }),
    ]);
  });

  it('moves a re-analyzed replay back to the top without duplicating it', () => {
    service.record(REPLAY_URI, analysis([{ username: 'A', kills: 1 }]));
    service.record(
      'https://replay.pokemonshowdown.com/other-123',
      analysis([{ username: 'B', kills: 2 }]),
    );
    service.record(REPLAY_URI, analysis([{ username: 'A', kills: 1 }]));

    expect(service.entries().map((entry) => entry.id)).toEqual([
      'gen9championsvgc2026regmb-2669364000',
      'other-123',
    ]);
  });

  it('survives a reload and drops malformed stored entries', () => {
    service.record(REPLAY_URI, analysis([{ username: 'A', kills: 1 }]));
    const stored = JSON.parse(
      localStorage.getItem('pdz.replayAnalyzer.history')!,
    );
    localStorage.setItem(
      'pdz.replayAnalyzer.history',
      JSON.stringify([...stored, { nonsense: true }]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    expect(TestBed.inject(ReplayHistoryService).entries().length).toBe(1);
  });

  it('serves a recorded analysis back from the session cache', () => {
    const recorded = analysis([{ username: 'A', kills: 1 }]);
    service.record(REPLAY_URI, recorded);

    expect(service.cached(REPLAY_URI)).toBe(recorded);
    expect(service.cached(`${REPLAY_URI}  `)).toBe(recorded);
    expect(service.cached('https://replay.pokemonshowdown.com/nope-1')).toBeUndefined();
  });

  it('evicts the least recently used analysis past the cache bound', () => {
    for (let i = 0; i < 12; i++) {
      service.record(
        `https://replay.pokemonshowdown.com/replay-${i}`,
        analysis([{ username: `P${i}`, kills: i }]),
      );
    }

    expect(service.cached('https://replay.pokemonshowdown.com/replay-0')).toBeUndefined();
    expect(service.cached('https://replay.pokemonshowdown.com/replay-1')).toBeUndefined();
    expect(service.cached('https://replay.pokemonshowdown.com/replay-2')).toBeDefined();
    expect(service.entries().length).toBe(12);
  });

  it('drops the cached analysis when its entry is removed', () => {
    service.record(REPLAY_URI, analysis([{ username: 'A', kills: 1 }]));
    service.remove('gen9championsvgc2026regmb-2669364000');

    expect(service.cached(REPLAY_URI)).toBeUndefined();
  });

  it('removes one entry and clears them all', () => {
    service.record(REPLAY_URI, analysis([{ username: 'A', kills: 1 }]));
    service.record(
      'https://replay.pokemonshowdown.com/other-123',
      analysis([{ username: 'B', kills: 2 }]),
    );

    service.remove('other-123');
    expect(service.entries().map((entry) => entry.id)).toEqual([
      'gen9championsvgc2026regmb-2669364000',
    ]);

    service.clear();
    expect(service.entries()).toEqual([]);
    expect(localStorage.getItem('pdz.replayAnalyzer.history')).toBe('[]');
  });
});
