import { InjectionToken } from '@angular/core';
import {
  DRAFT_OVERVIEW_PATH,
  EXTERNAL_DRAFTS_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';

export type DraftArea = {
  home: string[];
  root: string[];
};

export const DRAFTS_AREA: DraftArea = {
  home: ['/', DRAFT_OVERVIEW_PATH],
  root: ['/', DRAFT_OVERVIEW_PATH],
};

export const EXTERNAL_DRAFTS_AREA: DraftArea = {
  home: ['/', LEAGUE_ZONE_PATH],
  root: ['/', LEAGUE_ZONE_PATH, EXTERNAL_DRAFTS_PATH],
};

export const DRAFT_AREA = new InjectionToken<DraftArea>('DRAFT_AREA', {
  providedIn: 'root',
  factory: () => DRAFTS_AREA,
});

export function draftLinks(teamId: string, area: DraftArea = DRAFTS_AREA) {
  const page = [...area.root, teamId];
  return {
    home: area.home,
    page,
    form: [...page, 'form'],
    score: [...page, 'score'],
    matchup: (id: string) => [...page, 'matchup', id],
    edit: [...area.root, 'edit'],
    create: [...area.root, 'new'],
  };
}
