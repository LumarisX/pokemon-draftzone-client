import { ScoreEntryReplayPlayer, ScoreEntryReplayPokemon } from './score-entry.model';

export type RosterEntry = {
  key: string;
  ids: readonly string[];
};

export type ScoreEntryReplayRosters = {
  side1: readonly RosterEntry[];
  side2: readonly RosterEntry[];
};

export function replayFormeIds(mon: ScoreEntryReplayPokemon): string[] {
  return [...new Set([mon.id, ...(mon.formes ?? [])])].filter((id) => !!id);
}

export function rosterEntryIds(pokemon: {
  id: string;
  draftFormes?: { id: string }[];
}): string[] {
  return [
    ...new Set([
      pokemon.id,
      ...(pokemon.draftFormes?.map((forme) => forme.id) ?? []),
    ]),
  ].filter((id) => !!id);
}

export function toRosterEntries(
  pokemon: readonly { id: string; draftFormes?: { id: string }[] }[],
): RosterEntry[] {
  return pokemon.map((entry) => ({
    key: entry.id,
    ids: rosterEntryIds(entry),
  }));
}

export function matchReplayTeamToRoster<T extends ScoreEntryReplayPokemon>(
  replayTeam: readonly T[],
  roster: readonly RosterEntry[],
): Map<string, T> {
  const matched = new Map<string, T>();
  const claimed = new Set<T>();

  const claim = (
    entry: RosterEntry,
    candidateIds: (mon: T) => readonly string[],
  ) => {
    if (matched.has(entry.key)) return;
    const mon = replayTeam.find(
      (candidate) =>
        !claimed.has(candidate) &&
        candidateIds(candidate).some((id) => entry.ids.includes(id)),
    );
    if (!mon) return;
    matched.set(entry.key, mon);
    claimed.add(mon);
  };

  roster.forEach((entry) => claim(entry, (mon) => [mon.id]));
  roster.forEach((entry) => claim(entry, replayFormeIds));

  return matched;
}

export function countRosterOverlap(
  player: ScoreEntryReplayPlayer,
  roster: readonly RosterEntry[],
): number {
  return matchReplayTeamToRoster(player.team, roster).size;
}
