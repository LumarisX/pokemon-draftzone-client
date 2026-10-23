import { LEAGUE_ZONE_PATH, TIER_LIST_PATH } from '@pdz/core/route-paths';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';

export function tierListBase(
  league: LeagueZoneService,
  slug: string | null | undefined,
): string[] {
  const leagueSlug = league.leagueSlug();
  const tournamentSlug = league.tournamentSlug();
  if (leagueSlug && tournamentSlug)
    return ['/', LEAGUE_ZONE_PATH, leagueSlug, 'tournaments', tournamentSlug, 'tier-list'];
  return ['/', TIER_LIST_PATH, slug ?? ''];
}
