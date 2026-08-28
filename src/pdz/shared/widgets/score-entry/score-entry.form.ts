import { FormArray, FormBuilder, FormControl } from '@angular/forms';
import {
  SCORE_ENTRY_SIDES,
  ScoreEntryForfeit,
  ScoreEntryGameForm,
  ScoreEntryGameSeed,
  ScoreEntryKillField,
  ScoreEntryMatchForm,
  ScoreEntryMatchSeed,
  ScoreEntryPokemonForm,
  ScoreEntryPokemonStats,
  ScoreEntryReplayPlayer,
  ScoreEntryRoster,
  ScoreEntrySide,
  ScoreEntryStatus,
  ScoreEntryWarningGroup,
} from './score-entry.model';

const OTHER_SIDE: Record<ScoreEntrySide, ScoreEntrySide> = {
  side1: 'side2',
  side2: 'side1',
};

export function buildPokemonEntry(
  fb: FormBuilder,
  id: string,
  seed?: ScoreEntryPokemonStats,
): ScoreEntryPokemonForm {
  return fb.group({
    id: fb.control(id, { nonNullable: true }),
    direct: fb.control(seed?.kills?.direct ?? 0, { nonNullable: true }),
    indirect: fb.control(seed?.kills?.indirect ?? 0, { nonNullable: true }),
    teammate: fb.control(seed?.kills?.teammate ?? 0, { nonNullable: true }),
    status: fb.control<ScoreEntryStatus | null>(seed?.status ?? null),
  });
}

export function buildGameEntry(
  fb: FormBuilder,
  rosters: { side1: string[]; side2: string[] },
  seed?: ScoreEntryGameSeed,
): ScoreEntryGameForm {
  const side1 = rosters.side1.map((id) =>
    buildPokemonEntry(fb, id, seed?.side1?.[id]),
  );
  const side2 = rosters.side2.map((id) =>
    buildPokemonEntry(fb, id, seed?.side2?.[id]),
  );
  const survivorsOf = (roster: ScoreEntryPokemonForm[]) =>
    roster.filter((entry) => entry.controls.status.value === 'survived').length;

  return fb.group({
    link: fb.control(seed?.link ?? '', { nonNullable: true }),
    winner: fb.control<ScoreEntrySide | null>(seed?.winner ?? null),
    winnerLocked: fb.control(!!seed?.winner, { nonNullable: true }),
    side1Score: fb.control(seed?.side1Score ?? survivorsOf(side1), {
      nonNullable: true,
    }),
    side2Score: fb.control(seed?.side2Score ?? survivorsOf(side2), {
      nonNullable: true,
    }),
    side1ScoreLocked: fb.control(seed?.side1Score !== undefined, {
      nonNullable: true,
    }),
    side2ScoreLocked: fb.control(seed?.side2Score !== undefined, {
      nonNullable: true,
    }),
    side1: fb.array(side1),
    side2: fb.array(side2),
  });
}

export function rosterOf(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): FormArray<ScoreEntryPokemonForm> {
  return side === 'side1' ? game.controls.side1 : game.controls.side2;
}

export function rosterEntries(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): ScoreEntryPokemonForm[] {
  return rosterOf(game, side).controls;
}

export function survivors(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): number {
  return rosterEntries(game, side).filter(
    (entry) => entry.controls.status.value === 'survived',
  ).length;
}

export function scoreControl(game: ScoreEntryGameForm, side: ScoreEntrySide) {
  return side === 'side1' ? game.controls.side1Score : game.controls.side2Score;
}

export function scoreLockControl(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
) {
  return side === 'side1'
    ? game.controls.side1ScoreLocked
    : game.controls.side2ScoreLocked;
}

export function syncScore(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  if (scoreLockControl(game, side).value) return;
  scoreControl(game, side).setValue(survivors(game, side));
}

export function lockScore(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  scoreLockControl(game, side).setValue(true);
}

export function unlockScore(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  scoreLockControl(game, side).setValue(false);
  syncScore(game, side);
}

export function setPokemonStatus(
  entry: ScoreEntryPokemonForm,
  status: ScoreEntryStatus | null,
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  entry.controls.status.setValue(status);
  if (status === null || status === 'brought') {
    entry.controls.direct.setValue(0);
    entry.controls.indirect.setValue(0);
    entry.controls.teammate.setValue(0);
  }
  syncScore(game, side);
}

export function setKills(
  entry: ScoreEntryPokemonForm,
  field: ScoreEntryKillField,
  value: number,
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  const next = Math.max(0, Math.floor(Number(value) || 0));
  entry.controls[field].setValue(next);
  const status = entry.controls.status.value;
  if (next > 0 && (status === null || status === 'brought')) {
    entry.controls.status.setValue('survived');
    syncScore(game, side);
  }
}

export function adjustKills(
  entry: ScoreEntryPokemonForm,
  field: ScoreEntryKillField,
  delta: number,
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): void {
  setKills(entry, field, entry.controls[field].value + delta, game, side);
}

export function inferredGameWinner(
  game: ScoreEntryGameForm,
): ScoreEntrySide | null {
  const side1 = game.controls.side1Score.value;
  const side2 = game.controls.side2Score.value;
  if (side1 > side2) return 'side1';
  if (side2 > side1) return 'side2';
  return null;
}

export function gameWinner(game: ScoreEntryGameForm): ScoreEntrySide | null {
  return game.controls.winnerLocked.value
    ? game.controls.winner.value
    : inferredGameWinner(game);
}

export function setGameWinner(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide | null,
): void {
  game.controls.winner.setValue(side);
  game.controls.winnerLocked.setValue(side !== null);
}

export function matchWins(
  games: ScoreEntryGameForm[],
  side: ScoreEntrySide,
): number {
  return games.filter((game) => gameWinner(game) === side).length;
}

export function rosterPayload(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide,
): ScoreEntryRoster {
  return rosterEntries(game, side).reduce<ScoreEntryRoster>((acc, entry) => {
    const { id, status, direct, indirect, teammate } = entry.getRawValue();
    if (status) acc[id] = { kills: { direct, indirect, teammate }, status };
    return acc;
  }, {});
}

function countKills(roster: ScoreEntryPokemonForm[]): number {
  return roster.reduce(
    (sum, entry) =>
      sum + entry.controls.direct.value + entry.controls.indirect.value,
    0,
  );
}

function countTeammateKills(roster: ScoreEntryPokemonForm[]): number {
  return roster.reduce((sum, entry) => sum + entry.controls.teammate.value, 0);
}

function countFainted(roster: ScoreEntryPokemonForm[]): number {
  return roster.filter((entry) => entry.controls.status.value === 'fainted')
    .length;
}

function countRostered(roster: ScoreEntryPokemonForm[]): number {
  return roster.filter((entry) => entry.controls.status.value !== null).length;
}

function gameWarningMessages(
  game: ScoreEntryGameForm,
  options: {
    sideNames: Record<ScoreEntrySide, string>;
    expectedRoster?: number;
  },
): string[] {
  if (isGameEmpty(game)) return [];

  const { sideNames, expectedRoster } = options;
  const messages: string[] = [];
  const rosters = {
    side1: rosterEntries(game, 'side1'),
    side2: rosterEntries(game, 'side2'),
  };
  const rostered = {
    side1: countRostered(rosters.side1),
    side2: countRostered(rosters.side2),
  };

  const winner = gameWinner(game);
  if (!winner) {
    messages.push('The score is tied and no winner is picked.');
  } else if (
    scoreControl(game, winner).value <
    scoreControl(game, OTHER_SIDE[winner]).value
  ) {
    messages.push(
      `${sideNames[winner]} is set as the winner but has the lower score.`,
    );
  }

  if (expectedRoster !== undefined) {
    SCORE_ENTRY_SIDES.forEach((side) => {
      if (!rostered[side] || rostered[side] === expectedRoster) return;
      messages.push(
        `${sideNames[side]} brought ${rostered[side]} of ${expectedRoster} Pokemon.`,
      );
    });
  } else if (
    rostered.side1 &&
    rostered.side2 &&
    rostered.side1 !== rostered.side2
  ) {
    const short = rostered.side1 < rostered.side2 ? 'side1' : 'side2';
    const other = OTHER_SIDE[short];
    messages.push(
      `${sideNames[short]} brought ${rostered[short]} Pokemon, ${sideNames[other]} brought ${rostered[other]}.`,
    );
  }

  if (rostered.side1 && rostered.side2) {
    const owedBy = (roster: ScoreEntryPokemonForm[]): number =>
      countFainted(roster) - countTeammateKills(roster);

    SCORE_ENTRY_SIDES.forEach((side) => {
      const kills = countKills(rosters[side]);
      const owed = owedBy(rosters[OTHER_SIDE[side]]);
      if (kills === owed) return;
      messages.push(
        `${sideNames[side]} is credited with ${kills} KOs but ${sideNames[OTHER_SIDE[side]]} lost ${owed} Pokemon.`,
      );
    });
  }

  return messages;
}

export function scoreEntryWarnings(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
  options: {
    sideNames: Record<ScoreEntrySide, string>;
    expectedRoster?: number;
  },
): ScoreEntryWarningGroup[] {
  if (isMatchForfeit(match)) return [];

  const groups: ScoreEntryWarningGroup[] = [];

  games.forEach((game, index) => {
    const messages = gameWarningMessages(game, options);
    if (messages.length) groups.push({ where: `Game ${index + 1}`, messages });
  });

  const notice = matchWinnerNotice(match, games, options.sideNames);
  if (notice) groups.push({ where: 'Match result', messages: [notice] });

  return groups;
}

export function resetRoster(roster: FormArray<ScoreEntryPokemonForm>): void {
  roster.controls.forEach((entry) =>
    entry.patchValue({
      direct: 0,
      indirect: 0,
      teammate: 0,
      status: null,
    }),
  );
}

export function applyReplayPlayer(
  roster: FormArray<ScoreEntryPokemonForm>,
  player: ScoreEntryReplayPlayer,
  resolveId: (replayId: string) => string | undefined = (id) => id,
): void {
  resetRoster(roster);

  const byId = new Map(
    roster.controls.map((entry) => [entry.controls.id.value, entry]),
  );

  player.team.forEach((mon) => {
    const entry = byId.get(resolveId(mon.id) ?? mon.id);
    if (!entry) return;
    entry.patchValue({
      direct: mon.kills?.direct ?? 0,
      indirect: mon.kills?.indirect ?? 0,
      teammate: mon.kills?.teammate ?? 0,
      status: mon.status ?? null,
    });
  });
}

export function orderReplayPlayers<T extends ScoreEntryReplayPlayer>(
  players: T[],
  rosters: { side1: Set<string>; side2: Set<string> },
): { side1: T; side2: T } | null {
  if (players.length < 2) return null;
  const [first, second] = players;
  const overlap = (player: T, ids: Set<string>) =>
    player.team.reduce(
      (count, mon) => (ids.has(mon.id) ? count + 1 : count),
      0,
    );

  const straight =
    overlap(first, rosters.side1) + overlap(second, rosters.side2) >=
    overlap(first, rosters.side2) + overlap(second, rosters.side1);

  return straight
    ? { side1: first, side2: second }
    : { side1: second, side2: first };
}

export function buildMatchEntry(
  fb: FormBuilder,
  seed?: ScoreEntryMatchSeed,
): ScoreEntryMatchForm {
  const score = seed?.score ?? null;
  const forfeit = seed?.forfeit ?? null;

  return fb.group({
    side1Paste: fb.control(seed?.side1Paste ?? '', { nonNullable: true }),
    side2Paste: fb.control(seed?.side2Paste ?? '', { nonNullable: true }),
    side1Score: fb.control(score?.[0] ?? 0, { nonNullable: true }),
    side2Score: fb.control(score?.[1] ?? 0, { nonNullable: true }),
    scoreLocked: fb.control(score !== null, { nonNullable: true }),
    winner: fb.control<ScoreEntrySide | null>(seed?.winner ?? null),
    side1Forfeit: fb.control(forfeit === 'side1' || forfeit === 'both', {
      nonNullable: true,
    }),
    side2Forfeit: fb.control(forfeit === 'side2' || forfeit === 'both', {
      nonNullable: true,
    }),
  });
}

export function matchPasteControl(
  match: ScoreEntryMatchForm,
  side: ScoreEntrySide,
): FormControl<string> {
  return side === 'side1'
    ? match.controls.side1Paste
    : match.controls.side2Paste;
}

export function matchScoreControl(
  match: ScoreEntryMatchForm,
  side: ScoreEntrySide,
): FormControl<number> {
  return side === 'side1'
    ? match.controls.side1Score
    : match.controls.side2Score;
}

export function matchForfeitControl(
  match: ScoreEntryMatchForm,
  side: ScoreEntrySide,
): FormControl<boolean> {
  return side === 'side1'
    ? match.controls.side1Forfeit
    : match.controls.side2Forfeit;
}

export function matchForfeitedBy(
  match: ScoreEntryMatchForm,
): ScoreEntryForfeit | null {
  const side1 = match.controls.side1Forfeit.value;
  const side2 = match.controls.side2Forfeit.value;
  if (side1 && side2) return 'both';
  if (side1) return 'side1';
  if (side2) return 'side2';
  return null;
}

export function isMatchForfeit(match: ScoreEntryMatchForm): boolean {
  return matchForfeitedBy(match) !== null;
}

export function toggleMatchForfeit(
  match: ScoreEntryMatchForm,
  side: ScoreEntrySide,
): void {
  const control = matchForfeitControl(match, side);
  control.setValue(!control.value);
}

export function forfeitNeedsReason(
  match: ScoreEntryMatchForm,
  reason: FormControl<string> | null,
): boolean {
  return !!reason && isMatchForfeit(match) && !reason.value.trim();
}

export function isGameEmpty(game: ScoreEntryGameForm): boolean {
  if (game.controls.link.value.trim() || game.controls.winner.value) {
    return false;
  }
  return SCORE_ENTRY_SIDES.every((side) =>
    rosterEntries(game, side).every((entry) => {
      const { status, direct, indirect, teammate } = entry.getRawValue();
      return (
        (status === null || status === 'brought') &&
        !direct &&
        !indirect &&
        !teammate
      );
    }),
  );
}

export function carriedRosterSeed(
  game: ScoreEntryGameForm,
): ScoreEntryGameSeed {
  const carry = (side: ScoreEntrySide): ScoreEntryRoster =>
    rosterEntries(game, side).reduce<ScoreEntryRoster>((acc, entry) => {
      if (entry.controls.status.value === null) return acc;
      acc[entry.controls.id.value] = { status: 'brought' };
      return acc;
    }, {});

  return { side1: carry('side1'), side2: carry('side2') };
}

export function inferredMatchScore(
  games: ScoreEntryGameForm[],
): [number, number] {
  if (games.length === 1) {
    return [
      games[0].controls.side1Score.value,
      games[0].controls.side2Score.value,
    ];
  }
  return [matchWins(games, 'side1'), matchWins(games, 'side2')];
}

export function syncMatchScore(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
): void {
  if (match.controls.scoreLocked.value) return;
  const [side1, side2] = inferredMatchScore(games);
  match.controls.side1Score.setValue(side1);
  match.controls.side2Score.setValue(side2);
}

export function resetMatchScore(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
): void {
  match.controls.scoreLocked.setValue(false);
  syncMatchScore(match, games);
}

export function matchScoreOf(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
  side: ScoreEntrySide,
): number {
  if (match.controls.scoreLocked.value) {
    return matchScoreControl(match, side).value;
  }
  const inferred = inferredMatchScore(games);
  return side === 'side1' ? inferred[0] : inferred[1];
}

export function inferredMatchWinner(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
): ScoreEntrySide | null {
  const side1 = matchScoreOf(match, games, 'side1');
  const side2 = matchScoreOf(match, games, 'side2');
  if (side1 > side2) return 'side1';
  if (side2 > side1) return 'side2';
  return null;
}

export function resolvedMatchWinner(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
): ScoreEntrySide | null {
  const forfeited = matchForfeitedBy(match);
  if (forfeited === 'both') return null;
  if (forfeited) return OTHER_SIDE[forfeited];
  return match.controls.winner.value ?? inferredMatchWinner(match, games);
}

export function setMatchWinner(
  match: ScoreEntryMatchForm,
  side: ScoreEntrySide | null,
): void {
  if (isMatchForfeit(match)) return;
  match.controls.winner.setValue(side);
}

export function matchWinnerNotice(
  match: ScoreEntryMatchForm,
  games: ScoreEntryGameForm[],
  sideNames: Record<ScoreEntrySide, string>,
): string | null {
  if (isMatchForfeit(match)) return null;

  const winner = match.controls.winner.value;
  if (!winner) return null;

  const other = OTHER_SIDE[winner];
  if (matchScoreOf(match, games, winner) >= matchScoreOf(match, games, other)) {
    return null;
  }
  return `${sideNames[winner]} is set as the winner but has the lower score.`;
}

export function applyReplayToGame(
  game: ScoreEntryGameForm,
  players: ScoreEntryReplayPlayer[],
  rosters: { side1: Set<string>; side2: Set<string> },
  resolveId?: (replayId: string) => string | undefined,
): boolean {
  const ordered = orderReplayPlayers(players.slice(0, 2), rosters);
  if (!ordered) return false;

  applyReplayPlayer(game.controls.side1, ordered.side1, resolveId);
  applyReplayPlayer(game.controls.side2, ordered.side2, resolveId);

  game.controls.side1ScoreLocked.setValue(false);
  game.controls.side2ScoreLocked.setValue(false);
  game.controls.side1Score.setValue(survivors(game, 'side1'));
  game.controls.side2Score.setValue(survivors(game, 'side2'));
  setGameWinner(
    game,
    ordered.side1.win ? 'side1' : ordered.side2.win ? 'side2' : null,
  );

  return true;
}
