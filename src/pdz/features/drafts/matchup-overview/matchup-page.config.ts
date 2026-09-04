export interface MatchupPageConfig {
  source: 'draft' | 'league' | 'shared';
  back: boolean;
  share: boolean;
  teambuilder: boolean;
  notes: boolean;
}

export const DRAFT_MATCHUP_PAGE: MatchupPageConfig = {
  source: 'draft',
  back: true,
  share: true,
  teambuilder: true,
  notes: true,
};

export const LEAGUE_MATCHUP_PAGE: MatchupPageConfig = {
  source: 'league',
  back: true,
  share: true,
  teambuilder: true,
  notes: true,
};

export const SHARED_MATCHUP_PAGE: MatchupPageConfig = {
  source: 'shared',
  back: false,
  share: false,
  teambuilder: false,
  notes: false,
};
