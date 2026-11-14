import { BehaviorSubject } from 'rxjs';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';

export type PlannerTier = { tier: string; cost: number | null };

export type PlannerOwner = { teamName: string; teamLogo?: string };

export type PlannerTierRequirement = { tierName: string; required: number };

export type PlannerPokemon = { id: string; name: string };

export type PlannerContext = {
  storageKey: string;
  name: string;
  teamName: string | null;
  format: string;
  ruleset: string;
  min: number;
  max: number;
  totalPoints: number;
  tiers: ReadonlyMap<string, PlannerTier>;
  owners: ReadonlyMap<string, PlannerOwner>;
  options$: BehaviorSubject<DraftPokemon[]>;
  roster: PlannerPokemon[];
  tierRequirements: PlannerTierRequirement[];
  tierListLink: string[];
};

export function rosterChanges(
  team: PlannerPokemon[],
  roster: PlannerPokemon[],
): { added: PlannerPokemon[]; dropped: PlannerPokemon[] } {
  const teamIds = new Set(team.map((pokemon) => pokemon.id));
  const rosterIds = new Set(roster.map((pokemon) => pokemon.id));
  return {
    added: team.filter((pokemon) => !rosterIds.has(pokemon.id)),
    dropped: roster.filter((pokemon) => !teamIds.has(pokemon.id)),
  };
}
