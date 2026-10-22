import { PodiumPlace } from '@pdz/shared/data/podium/podium.component';
import { League } from '../league.interface';
import { getTeamLogoSrc } from '../league.util';

export function podiumPlaces(
  placements: readonly League.FinalPlacement[],
  teamLink?: (teamSlug: string) => readonly string[],
): PodiumPlace[] {
  return [...placements]
    .sort((a, b) => a.placement - b.placement)
    .slice(0, 3)
    .map((place) => ({
      name: place.name,
      logo: getTeamLogoSrc(place.logo),
      coach: place.coach ?? undefined,
      wins: place.wins,
      losses: place.losses,
      draws: place.draws,
      pokemon: (place.top?.length ? place.top : place.mvp ? [place.mvp] : []).map(
        (entry) => ({ id: entry.id, name: entry.name }),
      ),
      link: teamLink ? teamLink(place.teamSlug) : null,
    }));
}

export function seasonLabel(season: {
  completedAt: string | null;
  teamCount?: number;
}): string {
  const parts: string[] = [];
  if (season.completedAt) {
    parts.push(
      new Date(season.completedAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      }),
    );
  }
  if (season.teamCount) parts.push(`${season.teamCount} teams`);
  return parts.join(' · ');
}
