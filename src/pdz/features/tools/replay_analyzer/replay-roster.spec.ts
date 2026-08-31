import { ReplayPlayer, ReplayPokemon } from './replay.interface';
import {
  countRosterOverlap,
  matchReplayTeamToRoster,
  replayFormeIds,
  rosterEntryIds,
} from './replay-roster';

function mon(id: string, formes?: string[]): ReplayPokemon {
  return {
    id,
    name: id,
    formes,
    kills: { direct: 0, indirect: 0, teammate: 0 },
    status: 'survived',
    moveset: [],
    damageDealt: { direct: 0, indirect: 0, teammate: 0 },
    damageTaken: { direct: 0, indirect: 0, teammate: 0 },
    hpRestored: 0,
    calcLog: { damageDealt: [], damageTaken: [] },
  };
}

function roster(...ids: string[]) {
  return ids.map((id) => ({ key: id, ids: [id] }));
}

describe('replayFormeIds', () => {
  it('leads with the reported id and dedupes the forme history', () => {
    expect(replayFormeIds(mon('charizardmegay', ['charizard', 'charizardmegay'])))
      .toEqual(['charizardmegay', 'charizard']);
  });

  it('falls back to the id alone when no formes are reported', () => {
    expect(replayFormeIds(mon('pikachu'))).toEqual(['pikachu']);
  });
});

describe('rosterEntryIds', () => {
  it('includes every drafted forme', () => {
    expect(
      rosterEntryIds({
        id: 'urshifu',
        draftFormes: [{ id: 'urshifurapidstrike' }],
      }),
    ).toEqual(['urshifu', 'urshifurapidstrike']);
  });
});

describe('matchReplayTeamToRoster', () => {
  it('matches a mid-battle forme change back to the drafted base forme', () => {
    const matched = matchReplayTeamToRoster(
      [mon('charizardmegay', ['charizard', 'charizardmegay'])],
      roster('charizard', 'gengar'),
    );

    expect(matched.get('charizard')?.id).toBe('charizardmegay');
    expect(matched.has('gengar')).toBe(false);
  });

  it('prefers an exact id match over a forme match', () => {
    const megaY = mon('charizardmegay', ['charizard', 'charizardmegay']);
    const base = mon('charizard', ['charizard']);

    const matched = matchReplayTeamToRoster(
      [megaY, base],
      roster('charizard', 'charizardmegay'),
    );

    expect(matched.get('charizard')).toBe(base);
    expect(matched.get('charizardmegay')).toBe(megaY);
  });

  it('never assigns one replay Pokémon to two roster slots', () => {
    const matched = matchReplayTeamToRoster(
      [mon('ogerponwellspringtera', ['ogerponwellspring', 'ogerponwellspringtera'])],
      roster('ogerponwellspring', 'ogerpon'),
    );

    expect(matched.size).toBe(1);
    expect(matched.has('ogerponwellspring')).toBe(true);
  });

  it('matches a roster entry through its drafted formes', () => {
    const matched = matchReplayTeamToRoster(
      [mon('urshifurapidstrike')],
      [{ key: 'urshifu', ids: rosterEntryIds({ id: 'urshifu', draftFormes: [{ id: 'urshifurapidstrike' }] }) }],
    );

    expect(matched.get('urshifu')?.id).toBe('urshifurapidstrike');
  });
});

describe('countRosterOverlap', () => {
  it('counts forme changes toward the side it belongs to', () => {
    const player = {
      team: [
        mon('charizardmegay', ['charizard', 'charizardmegay']),
        mon('gengar'),
      ],
    } as ReplayPlayer;

    expect(countRosterOverlap(player, roster('charizard', 'gengar'))).toBe(2);
    expect(countRosterOverlap(player, roster('snorlax', 'pikachu'))).toBe(0);
  });
});
