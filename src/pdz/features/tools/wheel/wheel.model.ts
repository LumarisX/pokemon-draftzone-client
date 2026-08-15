export type WheelItem = {
  id: number;
  label: string;
  weight: number;
};

export type StoredWheelItem = {
  label: string;
  weight: number;
};

export type WheelOptions = {
  spinSeconds: number;
  minTurns: number;
  rimArc: number;
};

export type WheelHistoryEntry = {
  id: number;
  label: string;
  color: string;
  at: number;
};

export const MIN_WEIGHT = 1;
export const MAX_WEIGHT = 999;
export const MAX_LABEL_LENGTH = 60;
export const MAX_ITEMS = 9999;
export const MAX_HISTORY = 100;

export const MIN_SPIN_SECONDS = 1;
export const MAX_SPIN_SECONDS = 15;
export const MIN_TURNS = 1;
export const MAX_TURNS = 20;
export const MIN_RIM_ARC = 20;
export const MAX_RIM_ARC = 360;

export const DEFAULT_OPTIONS: WheelOptions = {
  spinSeconds: 4.5,
  minTurns: 5,
  rimArc: 90,
};

export function defaultItems(): StoredWheelItem[] {
  return [
    {
      label: 'Player 1',
      weight: 1,
    },
    {
      label: 'Player 2',
      weight: 1,
    },
    {
      label: 'Player 3',
      weight: 1,
    },
    {
      label: 'Player 4',
      weight: 1,
    },
    {
      label: 'Player 5',
      weight: 1,
    },
    {
      label: 'Player 6',
      weight: 1,
    },
  ];
}

export function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

export function clampWeight(value: number): number {
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(value)));
}

export function clampSpinSeconds(value: number): number {
  return Math.min(
    MAX_SPIN_SECONDS,
    Math.max(MIN_SPIN_SECONDS, Math.round(value * 10) / 10),
  );
}

export function clampTurns(value: number): number {
  return Math.min(MAX_TURNS, Math.max(MIN_TURNS, Math.round(value)));
}

export function clampRimArc(value: number): number {
  return Math.min(
    MAX_RIM_ARC,
    Math.max(MIN_RIM_ARC, Math.round(value / 2) * 2),
  );
}
