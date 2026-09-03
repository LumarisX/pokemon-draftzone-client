import { createSet, PokemonSet, toID } from '@pdz/sets';
import type { SaveTeamPayload, TeamContext } from '../data/teambuilder.models';

const CACHE_KEY = 'pdz_teambuilder_pending';
const LEGACY_KEY = 'matchup_teambuilder';

export interface PendingWrite {
  readonly slug: string;
  readonly payload: SaveTeamPayload;
  readonly at: number;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function readPending(): Record<string, PendingWrite> {
  return read<Record<string, PendingWrite>>(CACHE_KEY) ?? {};
}

export function rememberPending(slug: string, payload: SaveTeamPayload): void {
  write(CACHE_KEY, {
    ...readPending(),
    [slug]: { slug, payload, at: Date.now() },
  });
}

export function forgetPending(slug: string): void {
  const pending = readPending();
  if (!(slug in pending)) return;
  delete pending[slug];
  write(CACHE_KEY, pending);
}

export function pendingFor(slug: string): PendingWrite | null {
  return readPending()[slug] ?? null;
}

interface LegacySet {
  id?: string;
  name?: string;
  nickname?: string;
  level?: number;
  nature?: string;
  item?: string;
  ability?: string;
  teraType?: string;
  gender?: string;
  happiness?: number;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  moves?: string[];
  stats?: Record<string, { ivs?: number; evs?: number }>;
}

export interface LegacyTeam {
  readonly context: TeamContext;
  readonly sets: LegacySet[];
}

export function readLegacyTeams(): LegacyTeam[] {
  const stored = read<Record<string, { team?: LegacySet[] }>>(LEGACY_KEY);
  if (!stored) return [];
  return Object.entries(stored)
    .filter(([, value]) => Array.isArray(value?.team) && value.team.length > 0)
    .map(([matchupId, value]) => ({
      context: { type: 'matchup' as const, id: matchupId },
      sets: value.team ?? [],
    }));
}

export function clearLegacyTeams(): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    return;
  }
}

export function legacySetToPokemonSet(
  legacy: LegacySet,
  fallbackLevel: number,
): PokemonSet | null {
  if (!legacy.id) return null;
  const stats = legacy.stats ?? {};
  const pick = (key: 'ivs' | 'evs', fallback: number) => ({
    hp: stats['hp']?.[key] ?? fallback,
    atk: stats['atk']?.[key] ?? fallback,
    def: stats['def']?.[key] ?? fallback,
    spa: stats['spa']?.[key] ?? fallback,
    spd: stats['spd']?.[key] ?? fallback,
    spe: stats['spe']?.[key] ?? fallback,
  });

  return createSet({
    id: legacy.id,
    nickname: legacy.nickname || undefined,
    level: legacy.level ?? fallbackLevel,
    gender: legacy.gender === 'M' || legacy.gender === 'F' ? legacy.gender : '',
    ability: legacy.ability ? toID(legacy.ability) : undefined,
    item: legacy.item ? toID(legacy.item) : undefined,
    nature: legacy.nature,
    teraType: legacy.teraType,
    moves: (legacy.moves ?? []).filter(Boolean).map(toID),
    ivs: pick('ivs', 31),
    evs: pick('evs', 0),
    happiness: legacy.happiness,
    dynamaxLevel: legacy.dynamaxLevel,
    gigantamax: legacy.gigantamax,
  });
}
