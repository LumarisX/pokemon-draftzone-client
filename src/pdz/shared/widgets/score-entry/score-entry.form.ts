import { FormArray, FormBuilder } from '@angular/forms';
import {
  ScoreEntryGameForm,
  ScoreEntryGameSeed,
  ScoreEntryKillField,
  ScoreEntryPokemonForm,
  ScoreEntryPokemonStats,
  ScoreEntryReplayPlayer,
  ScoreEntryRoster,
  ScoreEntrySide,
  ScoreEntryStatus,
} from './score-entry.model';

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

export function setGameWinner(
  game: ScoreEntryGameForm,
  side: ScoreEntrySide | null,
): void {
  game.controls.winner.setValue(side);
}

export function matchWins(
  games: ScoreEntryGameForm[],
  side: ScoreEntrySide,
): number {
  return games.filter((game) => game.controls.winner.value === side).length;
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

export function gameWarnings(
  game: ScoreEntryGameForm,
  options: {
    sideNames: Record<ScoreEntrySide, string>;
    expectedRoster?: number;
  },
): string[] {
  const { sideNames, expectedRoster } = options;
  const warnings: string[] = [];
  const side1 = rosterEntries(game, 'side1');
  const side2 = rosterEntries(game, 'side2');

  const rostered1 = countRostered(side1);
  const rostered2 = countRostered(side2);

  if (expectedRoster !== undefined) {
    if (rostered1 !== expectedRoster) {
      warnings.push(`${sideNames.side1} has ${rostered1} Pokemon`);
    }
    if (rostered2 !== expectedRoster) {
      warnings.push(`${sideNames.side2} has ${rostered2} Pokemon`);
    }
  } else if (rostered1 !== rostered2) {
    warnings.push(
      `${sideNames.side1} brought ${rostered1} Pokemon, ${sideNames.side2} brought ${rostered2}`,
    );
  }

  const opposingFaints = (roster: ScoreEntryPokemonForm[]): number =>
    countFainted(roster) - countTeammateKills(roster);

  const kills1 = countKills(side1);
  const kills2 = countKills(side2);
  const owed1 = opposingFaints(side2);
  const owed2 = opposingFaints(side1);

  if (kills1 !== owed1) {
    warnings.push(
      `${sideNames.side1} KOs (${kills1}) don't match ${sideNames.side2} faints (${owed1})`,
    );
  }
  if (kills2 !== owed2) {
    warnings.push(
      `${sideNames.side2} KOs (${kills2}) don't match ${sideNames.side1} faints (${owed2})`,
    );
  }

  const winner = game.controls.winner.value;
  const score1 = game.controls.side1Score.value;
  const score2 = game.controls.side2Score.value;
  if (winner === 'side1' && score1 < score2) {
    warnings.push(`${sideNames.side1} won but has the lower score`);
  }
  if (winner === 'side2' && score2 < score1) {
    warnings.push(`${sideNames.side2} won but has the lower score`);
  }

  return warnings;
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
  game.controls.winner.setValue(
    ordered.side1.win ? 'side1' : ordered.side2.win ? 'side2' : null,
  );

  return true;
}
