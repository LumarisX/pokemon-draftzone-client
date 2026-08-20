export type MatchupCardSlotStatus = 'winner' | 'loser' | 'undecided';

export interface MatchupCardSlot {
  name: string;
  coach: string | null;
  logo?: string;
  pending: boolean;
  status: MatchupCardSlotStatus;
  score: number | null;
  link: string[] | null;
  sourceId: string | null;
}

export interface MatchupCard {
  id: string;
  label: string;
  decided: boolean;
  forfeit: boolean;
  /** Advanced by an organizer's ruling rather than by a played result. */
  advanced?: boolean;
  slots: [MatchupCardSlot, MatchupCardSlot];
  viewLink: string[] | null;
  breakdownLink: string[] | null;
  replays: string[];
}
