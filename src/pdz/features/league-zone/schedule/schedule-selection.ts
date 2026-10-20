export type ScheduleSelection =
  | { kind: 'stage'; key: string }
  | { kind: 'round'; index: number };
