import { nextMilestone, waitingMessage } from './tournament-milestones';

const NOW = new Date('2026-10-11T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

describe('tournament milestones', () => {
  it('picks the first milestone still ahead', () => {
    const info = {
      signUpDeadline: new Date(NOW - DAY),
      draftStart: new Date(NOW + DAY),
      seasonStart: new Date(NOW + 7 * DAY),
    };

    expect(nextMilestone(info, NOW)?.label).toBe('The draft starts');
  });

  it('skips milestones that are missing', () => {
    const info = {
      signUpDeadline: new Date(NOW - DAY),
      seasonStart: new Date(NOW + 7 * DAY),
    };

    expect(nextMilestone(info, NOW)?.label).toBe('The season starts');
  });

  it('has nothing to add once every milestone has passed', () => {
    const info = { signUpDeadline: new Date(NOW - DAY) };

    expect(nextMilestone(info, NOW)).toBeNull();
    expect(waitingMessage('Teams appear here soon.', info, NOW)).toBe(
      'Teams appear here soon.',
    );
  });

  it('appends when the next milestone happens', () => {
    const info = { signUpDeadline: new Date(NOW + DAY) };

    expect(waitingMessage('Teams appear here soon.', info, NOW)).toMatch(
      /^Teams appear here soon\. Sign-ups close .+\.$/,
    );
  });
});
