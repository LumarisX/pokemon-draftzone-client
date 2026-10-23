import { ClientTier } from '../tier-list.service';
import { ImportEntry, ImportPreview, LeagueTier, MatchOption } from '../tier-list.model';

export type Resolution = MatchOption[] | 'skip' | null;

export type TierDraft = {
  name: string;
  cost: number | null;
  banned: boolean;
  skip: boolean;
};

export type ImportRow = {
  key: string;
  tierIndex: number;
  entry: ImportEntry;
};

export type PlacedPokemon = {
  id: string;
  name: string;
  note?: string;
  tierIndex: number;
};

export function rowKey(tierIndex: number, entryIndex: number): string {
  return `${tierIndex}:${entryIndex}`;
}

export function allRows(preview: ImportPreview): ImportRow[] {
  return preview.tiers.flatMap((tier, tierIndex) =>
    tier.entries.map((entry, entryIndex) => ({
      key: rowKey(tierIndex, entryIndex),
      tierIndex,
      entry,
    })),
  );
}

export function initialResolutions(preview: ImportPreview): Map<string, Resolution> {
  const resolutions = new Map<string, Resolution>();
  for (const row of allRows(preview))
    resolutions.set(
      row.key,
      row.entry.match.status === 'matched' ? row.entry.match.pokemon : null,
    );
  return resolutions;
}

export function initialTiers(preview: ImportPreview): TierDraft[] {
  return preview.tiers.map((tier) => ({
    name: tier.name,
    cost: tier.cost ?? null,
    banned: tier.banned,
    skip: tier.untiered,
  }));
}

function noteFor(entry: ImportEntry): string | undefined {
  const parts = [entry.note, ...(entry.addons ?? [])].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

export function placements(
  preview: ImportPreview,
  tiers: TierDraft[],
  resolutions: Map<string, Resolution>,
  duplicateWinners: Map<string, number>,
): { placed: PlacedPokemon[]; skipped: string[] } {
  const placed = new Map<string, PlacedPokemon>();
  const skipped: string[] = [];

  for (const row of allRows(preview)) {
    const draft = tiers[row.tierIndex];
    if (!draft || draft.skip) continue;
    const resolution = resolutions.get(row.key);
    if (!resolution || resolution === 'skip') {
      if (!resolution) skipped.push(row.entry.text);
      continue;
    }
    for (const option of resolution) {
      const winner = duplicateWinners.get(option.id);
      if (winner !== undefined && winner !== row.tierIndex) continue;
      if (placed.has(option.id)) continue;
      placed.set(option.id, {
        id: option.id,
        name: option.name,
        note: noteFor(row.entry),
        tierIndex: row.tierIndex,
      });
    }
  }
  return { placed: [...placed.values()], skipped };
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function replacePayload(
  tiers: TierDraft[],
  placed: PlacedPokemon[],
  existing: LeagueTier[] = [],
): ClientTier[] {
  const named = existing.filter((tier) => tier.id);
  const payload: ClientTier[] = [];
  const indexToPayload = new Map<number, ClientTier>();

  tiers.forEach((draft, index) => {
    if (draft.skip || draft.banned) return;
    const match = named.find((tier) => sameName(tier.name, draft.name));
    const tier: ClientTier = {
      ...(match?.id && { id: match.id }),
      name: draft.name.trim() || `Tier ${index + 1}`,
      cost: draft.cost ?? 0,
      pokemon: [],
    };
    payload.push(tier);
    indexToPayload.set(index, tier);
  });

  const untiered: ClientTier = { name: 'Untiered', cost: 0, pokemon: [] };
  for (const pokemon of placed) {
    const draft = tiers[pokemon.tierIndex];
    if (draft.banned) {
      untiered.pokemon.push({ id: pokemon.id, name: pokemon.name, notes: pokemon.note, banned: true });
      continue;
    }
    indexToPayload
      .get(pokemon.tierIndex)
      ?.pokemon.push({ id: pokemon.id, name: pokemon.name, notes: pokemon.note });
  }
  if (untiered.pokemon.length) payload.push(untiered);
  return payload;
}

export function mergePayload(
  tiers: TierDraft[],
  placed: PlacedPokemon[],
  existing: LeagueTier[],
): ClientTier[] {
  const placedIds = new Set(placed.map((pokemon) => pokemon.id));
  const payload: ClientTier[] = existing
    .filter((tier) => tier.name !== 'Untiered')
    .map((tier) => ({
      ...(tier.id && { id: tier.id }),
      name: tier.name,
      cost: tier.cost ?? 0,
      pokemon: tier.pokemon
        .filter((pokemon) => !placedIds.has(pokemon.id))
        .map((pokemon) => ({
          id: pokemon.id,
          name: pokemon.name,
          notes: pokemon.notes,
          banned: pokemon.draftBanned,
          bannedAbilities: pokemon.banned?.abilities,
          formes: pokemon.formes?.map((forme) => forme.id),
        })),
    }));

  const keptBanned = (existing.find((tier) => tier.name === 'Untiered')?.pokemon ?? [])
    .filter((pokemon) => pokemon.draftBanned && !placedIds.has(pokemon.id))
    .map((pokemon) => ({ id: pokemon.id, name: pokemon.name, notes: pokemon.notes, banned: true }));
  const untiered: ClientTier = { name: 'Untiered', cost: 0, pokemon: keptBanned };

  for (const pokemon of placed) {
    const draft = tiers[pokemon.tierIndex];
    if (draft.banned) {
      untiered.pokemon.push({ id: pokemon.id, name: pokemon.name, notes: pokemon.note, banned: true });
      continue;
    }
    let target = payload.find((tier) => sameName(tier.name, draft.name));
    if (!target) {
      target = { name: draft.name.trim() || 'Imported', cost: draft.cost ?? 0, pokemon: [] };
      payload.push(target);
    }
    target.pokemon.push({ id: pokemon.id, name: pokemon.name, notes: pokemon.note });
  }
  if (untiered.pokemon.length) payload.push(untiered);
  return payload;
}

export function rememberedChoices(
  preview: ImportPreview,
  resolutions: Map<string, Resolution>,
): { text: string; pokemonIds: string[] }[] {
  const choices = new Map<string, string[]>();
  for (const row of allRows(preview)) {
    if (row.entry.match.status === 'matched') continue;
    const resolution = resolutions.get(row.key);
    if (!resolution || resolution === 'skip') continue;
    choices.set(row.entry.text, resolution.map((option) => option.id));
  }
  return [...choices.entries()].map(([text, pokemonIds]) => ({ text, pokemonIds }));
}
