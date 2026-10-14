import { League } from './league.interface';

export interface TournamentMilestone {
  label: string;
  at: Date;
}

type MilestoneDates = Pick<
  League.LeagueInfo,
  'signUpDeadline' | 'draftStart' | 'seasonStart'
>;

const MILESTONES: { key: keyof MilestoneDates; label: string }[] = [
  { key: 'signUpDeadline', label: 'Sign-ups close' },
  { key: 'draftStart', label: 'The draft starts' },
  { key: 'seasonStart', label: 'The season starts' },
];

export function nextMilestone(
  info: MilestoneDates | null | undefined,
  now: number = Date.now(),
): TournamentMilestone | null {
  if (!info) return null;
  for (const { key, label } of MILESTONES) {
    const value = info[key];
    if (!value) continue;
    const at = new Date(value);
    if (!Number.isNaN(at.getTime()) && at.getTime() > now) return { label, at };
  }
  return null;
}

export function formatMilestoneTime(at: Date): string {
  return at.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function milestoneSentence(milestone: TournamentMilestone): string {
  return `${milestone.label} ${formatMilestoneTime(milestone.at)}.`;
}

export function waitingMessage(
  base: string,
  info: MilestoneDates | null | undefined,
  now?: number,
): string {
  const milestone = nextMilestone(info, now);
  return milestone ? `${base} ${milestoneSentence(milestone)}` : base;
}
