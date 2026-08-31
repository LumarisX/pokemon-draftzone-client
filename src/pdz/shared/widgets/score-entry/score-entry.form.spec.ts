import { FormBuilder } from '@angular/forms';
import {
  adjustKills,
  applyReplayToGame,
  buildGameEntry,
  buildMatchEntry,
  carriedRosterSeed,
  gameWinner,
  isGameEmpty,
  lockScore,
  scoreEntryWarnings,
  setGameWinner,
  rosterEntries,
  rosterPayload,
  matchWins,
  setKills,
  setPokemonStatus,
  survivors,
  unlockScore,
} from './score-entry.form';
import { ScoreEntryGameForm, ScoreEntryGameSeed } from './score-entry.model';
import { toRosterEntries } from './score-entry.replay';

const fb = new FormBuilder();
const ROSTERS = {
  side1: ['pikachu', 'charizard'],
  side2: ['gengar', 'snorlax'],
};
const REPLAY_ROSTERS = {
  side1: toRosterEntries(ROSTERS.side1.map((id) => ({ id }))),
  side2: toRosterEntries(ROSTERS.side2.map((id) => ({ id }))),
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

describe('carriedRosterSeed', () => {
  it('carries every mon that saw the field back as brought, and no kills', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'fainted', game, 'side1');
    setKills(entry(game, 'side1', 0), 'direct', 2, game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'brought', game, 'side2');

    expect(carriedRosterSeed(game)).toEqual({
      side1: { pikachu: { status: 'brought' }, charizard: { status: 'brought' } },
      side2: { gengar: { status: 'brought' } },
    });
  });

  it('leaves benched mons benched in the next game', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');

    const next = build(carriedRosterSeed(game));

    expect(entry(next, 'side1', 0).controls.status.value).toBe('brought');
    expect(entry(next, 'side1', 1).controls.status.value).toBeNull();
    expect(entry(next, 'side1', 0).controls.direct.value).toBe(0);
  });

  it('leaves the carried game reading as untouched so it raises nothing', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setKills(entry(game, 'side1', 0), 'direct', 1, game, 'side1');

    const next = build(carriedRosterSeed(game));

    expect(isGameEmpty(next)).toBe(true);
    expect(scoreEntryWarnings(buildMatchEntry(fb), [next], { sideNames: NAMES }))
      .toEqual([]);
  });
});

describe('scoreEntryWarnings', () => {
  const warn = (games: ScoreEntryGameForm[], expectedRoster?: number) =>
    scoreEntryWarnings(buildMatchEntry(fb), games, {
      sideNames: NAMES,
      expectedRoster,
    });

  it('says nothing at all about a game nobody has touched yet', () => {
    expect(warn([build()], 2)).toEqual([]);
  });

  it('is silent on a consistent game', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'fainted', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'fainted', game, 'side2');
    setKills(entry(game, 'side1', 0), 'direct', 2, game, 'side1');
    setKills(entry(game, 'side2', 0), 'direct', 1, game, 'side2');

    expect(warn([game])).toEqual([]);
  });

  it('names the game each warning came from, and skips the clean ones', () => {
    const clean = build();
    setPokemonStatus(entry(clean, 'side1', 0), 'survived', clean, 'side1');
    setPokemonStatus(entry(clean, 'side2', 0), 'fainted', clean, 'side2');
    setKills(entry(clean, 'side1', 0), 'direct', 1, clean, 'side1');

    const tied = build();
    setPokemonStatus(entry(tied, 'side1', 0), 'survived', tied, 'side1');
    setPokemonStatus(entry(tied, 'side2', 0), 'survived', tied, 'side2');

    expect(warn([clean, tied])).toEqual([
      {
        where: 'Game 2',
        messages: ['The score is tied and no winner is picked.'],
      },
    ]);
  });

  it('reports mismatched rosters and unaccounted KOs against the teams by name', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'fainted', game, 'side2');

    const messages = warn([game])[0].messages;

    expect(messages).toContain(
      'Team A brought 1 Pokemon, Team B brought 2.',
    );
    expect(messages).toContain(
      'Team A is credited with 0 KOs but Team B lost 2 Pokemon.',
    );
  });

  it('discounts teammate KOs from the faints the other side owes', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side1', 1), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'survived', game, 'side2');
    setKills(entry(game, 'side2', 1), 'teammate', 1, game, 'side2');

    expect(warn([game])).toEqual([]);
  });

  it('holds the expected-roster count against the side that is short', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'fainted', game, 'side2');
    setPokemonStatus(entry(game, 'side2', 1), 'fainted', game, 'side2');

    const messages = warn([game], 2)[0].messages;

    expect(messages).toContain('Team A brought 1 of 2 Pokemon.');
    expect(messages.some((m) => m.startsWith('Team B brought'))).toBe(false);
  });

  it('picks the winner off the score without being asked', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side2', 0), 'survived', game, 'side2');

    expect(gameWinner(game)).toBe('side2');
    expect(warn([game])).toEqual([]);
  });

  it('only asks for a winner when the score cannot answer', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    setPokemonStatus(entry(game, 'side2', 0), 'survived', game, 'side2');

    expect(gameWinner(game)).toBeNull();
    expect(warn([game])[0].messages).toContain(
      'The score is tied and no winner is picked.',
    );
  });

  it('flags a hand-picked winner that lost on score', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side2', 0), 'survived', game, 'side2');
    setGameWinner(game, 'side1');

    expect(warn([game])[0].messages).toContain(
      'Team A is set as the winner but has the lower score.',
    );
  });

  it('hands the winner back to the score when the pick is cleared', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side2', 0), 'survived', game, 'side2');
    setGameWinner(game, 'side1');

    expect(gameWinner(game)).toBe('side1');

    setGameWinner(game, null);

    expect(gameWinner(game)).toBe('side2');
  });

  it('files a contradicted match winner under the match, not a game', () => {
    const game = build({ winner: 'side1', side1Score: 0, side2Score: 3 });
    const match = buildMatchEntry(fb, { winner: 'side1', score: [0, 3] });

    const groups = scoreEntryWarnings(match, [game], { sideNames: NAMES });

    expect(groups.at(-1)).toEqual({
      where: 'Match result',
      messages: ['Team A is set as the winner but has the lower score.'],
    });
  });

  it('drops every game warning once the match is a forfeit', () => {
    const game = build();
    setPokemonStatus(entry(game, 'side1', 0), 'survived', game, 'side1');
    const match = buildMatchEntry(fb, { forfeit: 'side1' });

    expect(scoreEntryWarnings(match, [game], { sideNames: NAMES })).toEqual([]);
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

    expect(applyReplayToGame(game, players, REPLAY_ROSTERS)).toBe(true);

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

    applyReplayToGame(game, players, REPLAY_ROSTERS);

    expect(game.controls.side1ScoreLocked.value).toBe(false);
    expect(game.controls.side1Score.value).toBe(1);
  });

  it('maps a mid-battle forme change back onto the drafted Pokemon', () => {
    const game = build();

    applyReplayToGame(
      game,
      [
        {
          win: true,
          team: [
            {
              id: 'charizardmegay',
              formes: ['charizard', 'charizardmegay'],
              status: 'fainted',
              kills: { direct: 3 },
            },
          ],
        },
        { win: false, team: [{ id: 'gengar', status: 'fainted', kills: {} }] },
      ],
      REPLAY_ROSTERS,
    );

    expect(entry(game, 'side1', 1).controls.status.value).toBe('fainted');
    expect(entry(game, 'side1', 1).controls.direct.value).toBe(3);
  });

  it('refuses a replay that does not have two players', () => {
    const game = build();

    expect(applyReplayToGame(game, [players[0]], REPLAY_ROSTERS)).toBe(false);
  });
});
