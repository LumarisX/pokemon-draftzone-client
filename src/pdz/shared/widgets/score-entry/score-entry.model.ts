import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';

export type ScoreEntrySide = 'side1' | 'side2';

export type ScoreEntryStatus = 'brought' | 'survived' | 'fainted';

export type ScoreEntryKillField = 'direct' | 'indirect' | 'teammate';

export type ScoreEntryKills = Partial<Record<ScoreEntryKillField, number>>;

export type ScoreEntryPokemonStats = {
  kills?: ScoreEntryKills;
  status: ScoreEntryStatus;
};

export type ScoreEntryRoster = Record<string, ScoreEntryPokemonStats>;

export type ScoreEntryPokemon = Pokemon<DraftOptions>;

export type ScoreEntryPokemonForm = FormGroup<{
  id: FormControl<string>;
  direct: FormControl<number>;
  indirect: FormControl<number>;
  teammate: FormControl<number>;
  status: FormControl<ScoreEntryStatus | null>;
}>;

export type ScoreEntryGameForm = FormGroup<{
  link: FormControl<string>;
  winner: FormControl<ScoreEntrySide | null>;
  winnerLocked: FormControl<boolean>;
  side1Score: FormControl<number>;
  side2Score: FormControl<number>;
  side1ScoreLocked: FormControl<boolean>;
  side2ScoreLocked: FormControl<boolean>;
  side1: FormArray<ScoreEntryPokemonForm>;
  side2: FormArray<ScoreEntryPokemonForm>;
}>;

export type ScoreEntryGameSeed = {
  link?: string;
  winner?: ScoreEntrySide | null;
  side1Score?: number;
  side2Score?: number;
  side1?: ScoreEntryRoster;
  side2?: ScoreEntryRoster;
};

export type ScoreEntryForfeit = ScoreEntrySide | 'both';

export type ScoreEntryWarningGroup = {
  where: string;
  messages: string[];
};


export type ScoreEntryMatchForm = FormGroup<{
  side1Paste: FormControl<string>;
  side2Paste: FormControl<string>;
  side1Score: FormControl<number>;
  side2Score: FormControl<number>;
  scoreLocked: FormControl<boolean>;
  winner: FormControl<ScoreEntrySide | null>;
  side1Forfeit: FormControl<boolean>;
  side2Forfeit: FormControl<boolean>;
}>;

export type ScoreEntryMatchSeed = {
  side1Paste?: string;
  side2Paste?: string;
  score?: [number, number] | null;
  winner?: ScoreEntrySide | null;
  forfeit?: ScoreEntryForfeit | null;
};

export type ScoreEntryReplayPokemon = {
  id: string;
  kills?: ScoreEntryKills;
  status?: ScoreEntryStatus;
};

export type ScoreEntryReplayPlayer = {
  win: boolean;
  team: ScoreEntryReplayPokemon[];
};

export const SCORE_ENTRY_STATUSES: readonly {
  value: ScoreEntryStatus | null;
  label: string;
}[] = [
  { value: null, label: 'Benched' },
  { value: 'brought', label: 'Brought' },
  { value: 'survived', label: 'Survived' },
  { value: 'fainted', label: 'Fainted' },
];

export const SCORE_ENTRY_KILL_FIELDS: readonly {
  field: ScoreEntryKillField;
  label: string;
}[] = [
  { field: 'direct', label: 'Direct' },
  { field: 'indirect', label: 'Indirect' },
  { field: 'teammate', label: 'Team' },
];

export const SCORE_ENTRY_SIDES: readonly ScoreEntrySide[] = ['side1', 'side2'];

export const REPLAY_URL_PATTERN = /^replay\.pokemonshowdown\.com\/.+$/i;

export function isReplayUrl(url: string): boolean {
  return REPLAY_URL_PATTERN.test(url.trim().replace(/^https?:\/\//i, ''));
}
