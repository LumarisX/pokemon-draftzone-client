import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LEAGUE_ZONE_PATH, TOURNAMENT_PATH } from '@pdz/core/route-paths';

const LEGACY_TOURNAMENT_URL = new RegExp(
  `^/${LEAGUE_ZONE_PATH}/[^/?#]+/tournaments/`,
);

export function toTournamentUrl(url: string): string {
  return url.replace(LEGACY_TOURNAMENT_URL, `/${TOURNAMENT_PATH}/`);
}

export const legacyTournamentRedirect: CanActivateFn = (_route, state) =>
  inject(Router).parseUrl(toTournamentUrl(state.url));
