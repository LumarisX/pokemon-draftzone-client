import { InjectionToken } from '@angular/core';
import {
  DASHBOARD_PATH,
  DRAFT_OVERVIEW_PATH,
  EXTERNAL_TOURNAMENTS_PATH,
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
  home: ['/', DASHBOARD_PATH],
  root: ['/', DASHBOARD_PATH, EXTERNAL_TOURNAMENTS_PATH],
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
