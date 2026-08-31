import { ReplayPlayer, ReplayPokemon } from './replay.interface';

export type RosterEntry = {
  key: string;
  ids: readonly string[];
};

export function replayFormeIds(mon: ReplayPokemon): string[] {
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

export function matchReplayTeamToRoster(
  replayTeam: readonly ReplayPokemon[],
  roster: readonly RosterEntry[],
): Map<string, ReplayPokemon> {
  const matched = new Map<string, ReplayPokemon>();
  const claimed = new Set<ReplayPokemon>();

  const claim = (
    entry: RosterEntry,
    candidateIds: (mon: ReplayPokemon) => readonly string[],
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
  player: ReplayPlayer,
  roster: readonly RosterEntry[],
): number {
  return matchReplayTeamToRoster(player.team, roster).size;
}
