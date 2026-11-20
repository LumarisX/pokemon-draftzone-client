import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import {
  draftLinks,
  EXTERNAL_DRAFTS_AREA,
} from '@pdz/features/drafts/draft-area';
import { tournamentLink } from '@pdz/features/dashboard/dashboard.model';
import { AchievementRarity } from '@pdz/shared/data/achievement/achievement-badge.component';

export type ProfileRecord = { wins: number; draws: number; losses: number };

export type ProfileSeason = {
  id: string;
  kind: 'hosted' | 'external' | 'archive';
  teamName: string;
  logo: string | null;
  leagueName: string;
  tournamentName: string | null;
  pokemon: Pokemon<DraftOptions>[];
  record: ProfileRecord | null;
  outcome: {
    placement: number;
    of: number;
    label: string | null;
    champion: boolean;
  } | null;
  completedAt: string | null;
  hosted: {
    leagueSlug: string;
    tournamentSlug: string;
    teamSlug: string;
  } | null;
  external: { slug: string } | null;
  archive: { id: string } | null;
};

export type ProfileAchievement = {
  id: string;
  name: string;
  icon: string;
  rarity: AchievementRarity;
  seasons: number;
};

export type Profile = {
  career: ProfileRecord & {
    seasons: number;
    winRate: number | null;
    titles: number;
    best: { placement: number; of: number } | null;
  };
  completed: ProfileSeason[];
  achievements: ProfileAchievement[];
};

export type PublicProfile = {
  profileId?: string;
  displayName: string;
  joined: string | null;
  private: boolean;
  isYou: boolean;
  profile: Profile | null;
};

export function seasonLink(season: ProfileSeason): unknown[] {
  if (season.hosted)
    return [
      ...tournamentLink(season.hosted.leagueSlug, season.hosted.tournamentSlug),
      'teams',
      season.hosted.teamSlug,
    ];
  if (season.external)
    return draftLinks(season.external.slug, EXTERNAL_DRAFTS_AREA).page;
  return [
    ...EXTERNAL_DRAFTS_AREA.root,
    'archives',
    season.archive?.id ?? '',
    'stats',
  ];
}
