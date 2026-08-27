import { FormBuilder } from '@angular/forms';
import {
  adjustKills,
  applyReplayToGame,
  buildGameEntry,
  gameWarnings,
  lockScore,
  rosterEntries,
  rosterPayload,
  matchWins,
  setKills,
  setPokemonStatus,
  survivors,
  unlockScore,
} from './score-entry.form';
import { ScoreEntryGameForm, ScoreEntryGameSeed } from './score-entry.model';

const fb = new FormBuilder();
const ROSTERS = {
  side1: ['pikachu', 'charizard'],
  side2: ['gengar', 'snorlax'],
};
const NAMES = { side1: 'Team A', side2: 'Team B' } as const;

function build(seed?: ScoreEntryGameSeed): ScoreEntryGameForm {
  return buildGameEntry(fb, ROSTERS, seed);
}

function entry(game: ScoreEntryGameForm, side: 'side1' | 'side2', index = 0) {
  return rosterEntries(game, side)[index];
}

describe('buildGameEntry', () => {
  it('creates one entry per drafted Pokemon on each side, all benched', () => {
    const game = build();

    expect(
      rosterEntries(game, 'side1').map((e) => e.controls.id.value),
    ).toEqual(ROSTERS.side1);
    expect(
      rosterEntries(game, 'side2').map((e) => e.controls.status.value),
    ).toEqual([null, null]);
    expect(game.controls.side1Score.value).toBe(0);
    expect(game.controls.side1ScoreLocked.value).toBe(false);
  });

  it('seeds statuses and kills, and treats a seeded score as a manual override', () => {
    const game = build({
      link: 'replay.pokemonshowdown.com/gen9-1',
      winner: 'side2',
      side1Score: 4,
      side1: {
        pikachu: { kills: { direct: 2, indirect: 1 }, status: 'survived' },
      },
      side2: { gengar: { status: 'fainted' } },
    });

    expect(entry(game, 'side1').controls.direct.value).toBe(2);
    expect(entry(game, 'side1').controls.indirect.value).toBe(1);
    expect(entry(game, 'side1').controls.status.value).toBe('survived');
    expect(entry(game, 'side2').controls.status.value).toBe('fainted');
    expect(game.controls.winner.value).toBe('side2');
    expect(game.controls.side1Score.value).toBe(4);
    expect(game.controls.side1ScoreLocked.value).toBe(true);
    expect(game.controls.side2ScoreLocked.value).toBe(false);
  });
});

describe('score syncing', () => {
  it('recounts survivors as statuses change while unlocked', () => {
    const game = build();

    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    expect(game.controls.side1Score.value).toBe(1);

    setPokemonStatus(entry(game, 'side1', 1), 'survived', game, 'side1');
    expect(game.controls.side1Score.value).toBe(2);

    setPokemonStatus(entry(game, 'side1', 1), 'fainted', game, 'side1');
    expect(game.controls.side1Score.value).toBe(1);
  });

  it('stops recounting once the score is entered by hand, and resumes on reset', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');

    lockScore(game, 'side1');
    game.controls.side1Score.setValue(6);
    setPokemonStatus(entry(game, 'side1', 1), 'survived', game, 'side1');
    expect(game.controls.side1Score.value).toBe(6);

    unlockScore(game, 'side1');
    expect(game.controls.side1Score.value).toBe(2);
  });
});

describe('kill entry', () => {
  it('clamps to zero and floors fractional input', () => {
    const game = build();
    const mon = entry(game, 'side1');

    setKills(mon, 'direct', 2.7, game, 'side1');
    expect(mon.controls.direct.value).toBe(2);

    adjustKills(mon, 'direct', -5, game, 'side1');
    expect(mon.controls.direct.value).toBe(0);
  });

  it('promotes a benched Pokemon to survived once it scores a KO', () => {
    const game = build();
    const mon = entry(game, 'side1');

    adjustKills(mon, 'direct', 1, game, 'side1');

    expect(mon.controls.status.value).toBe('survived');
    expect(game.controls.side1Score.value).toBe(1);
  });

  it('leaves a fainted Pokemon fainted when it scores a KO', () => {
    const game = build();
    const mon = entry(game, 'side1');
    setPokemonStatus(mon, 'fainted', game, 'side1');

    adjustKills(mon, 'indirect', 1, game, 'side1');

    expect(mon.controls.status.value).toBe('fainted');
  });

  it('clears kills when a Pokemon drops back to bench or team preview', () => {
    const game = build();
    const mon = entry(game, 'side1');
    setKills(mon, 'direct', 3, game, 'side1');

    setPokemonStatus(mon, 'brought', game, 'side1');

    expect(mon.controls.direct.value).toBe(0);
  });
});

describe('rosterPayload', () => {
  it('emits only Pokemon with a status, keeping all three kill buckets', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setKills(entry(game, 'side1', 0), 'direct', 2, game, 'side1');
    setKills(entry(game, 'side1', 0), 'teammate', 1, game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'brought', game, 'side1');

    expect(rosterPayload(game, 'side1')).toEqual({
      pikachu: {
        kills: { direct: 2, indirect: 0, teammate: 1 },
        status: 'survived',
      },
      charizard: {
        kills: { direct: 0, indirect: 0, teammate: 0 },
        status: 'brought',
      },
    });
    expect(rosterPayload(game, 'side2')).toEqual({});
  });
});

describe('gameWarnings', () => {
  it('is silent on a consistent game', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'fainted', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'fainted', game, 'side2');
    setKills(entry(game, 'side1', 0), 'direct', 2, game, 'side1');
    setKills(entry(game, 'side2', 0), 'direct', 1, game, 'side2');

    expect(gameWarnings(game, { sideNames: NAMES })).toEqual([]);
  });

  it('flags mismatched roster sizes and unaccounted KOs', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'fainted', game, 'side2');

    const warnings = gameWarnings(game, { sideNames: NAMES });

    expect(warnings).toContain('Team A brought 1 Pokemon, Team B brought 2');
    expect(
      warnings.some((w) => w.startsWith("Team A KOs (0) don't match")),
    ).toBe(true);
  });

  it('discounts teammate KOs from the faints the other side owes', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'survived', game, 'side2');
    setKills(entry(game, 'side2', 1), 'teammate', 1, game, 'side2');

    expect(gameWarnings(game, { sideNames: NAMES })).toEqual([]);
  });

  it('flags a roster that does not match the expected size', () => {
    const game = build();

    const warnings = gameWarnings(game, {
      sideNames: NAMES,
      expectedRoster: 2,
    });

    expect(warnings).toContain('Team A has 0 Pokemon');
    expect(warnings).toContain('Team B has 0 Pokemon');
  });

  it('flags a winner that lost on score', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side2', 0), 'survived', game, 'side2');
    game.controls.winner.setValue('side1');

    expect(gameWarnings(game, { sideNames: NAMES })).toContain(
      'Team A won but has the lower score',
    );
  });
});

describe('seriesWins', () => {
  it('counts games won per side and ignores undecided games', () => {
    const games = [
      build({ winner: 'side1' }),
      build({ winner: 'side2' }),
      build({ winner: 'side1' }),
      build(),
    ];

    expect(matchWins(games, 'side1')).toBe(2);
    expect(matchWins(games, 'side2')).toBe(1);
  });
});

describe('applyReplayToGame', () => {
  const players = [
    {
      win: false,
      team: [
        { id: 'gengar', status: 'fainted' as const, kills: { direct: 1 } },
        { id: 'snorlax', status: 'fainted' as const, kills: {} },
      ],
    },
    {
      win: true,
      team: [
        { id: 'pikachu', status: 'survived' as const, kills: { direct: 2 } },
        { id: 'charizard', status: 'fainted' as const, kills: {} },
      ],
    },
  ];

  it('matches players to sides by roster overlap regardless of replay order', () => {
    const game = build();

    expect(
      applyReplayToGame(game, players, {
        side1: new Set(ROSTERS.side1),
        side2: new Set(ROSTERS.side2),
      }),
    ).toBe(true);

    expect(entry(game, 'side1', 0).controls.status.value).toBe('survived');
    expect(entry(game, 'side1', 0).controls.direct.value).toBe(2);
    expect(entry(game, 'side2', 0).controls.status.value).toBe('fainted');
    expect(game.controls.winner.value).toBe('side1');
    expect(survivors(game, 'side1')).toBe(1);
  });

  it('overrides a manual score, since replay data is authoritative', () => {
    const game = build();
    lockScore(game, 'side1');
    game.controls.side1Score.setValue(5);

    applyReplayToGame(game, players, {
      side1: new Set(ROSTERS.side1),
      side2: new Set(ROSTERS.side2),
    });

    expect(game.controls.side1ScoreLocked.value).toBe(false);
    expect(game.controls.side1Score.value).toBe(1);
  });

  it('maps a replay forme back onto the drafted Pokemon', () => {
    const game = build();

    applyReplayToGame(
      game,
      [
        {
          win: true,
          team: [{ id: 'charizardmegay', status: 'survived', kills: {} }],
        },
        { win: false, team: [{ id: 'gengar', status: 'fainted', kills: {} }] },
      ],
      {
        side1: new Set([...ROSTERS.side1, 'charizardmegay']),
        side2: new Set(ROSTERS.side2),
      },
      (id) => (id === 'charizardmegay' ? 'charizard' : id),
    );

    expect(entry(game, 'side1', 1).controls.status.value).toBe('survived');
  });

  it('refuses a replay that does not have two players', () => {
    const game = build();

    expect(
      applyReplayToGame(game, [players[0]], {
        side1: new Set(ROSTERS.side1),
        side2: new Set(ROSTERS.side2),
      }),
    ).toBe(false);
  });
});
