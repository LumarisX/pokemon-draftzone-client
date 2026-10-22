import {
  LIVE_PICK_MINUTES,
  QUICK_SETUP,
  QuickSetupContext,
  QuickSetupId,
  SLOW_PICK_MINUTES,
} from './quick-setup';
import { DraftPoolValue } from './settings-schema';
import { EMPTY_SETTINGS } from './tournament-settings.store';

function pool(overrides: Partial<DraftPoolValue> = {}): DraftPoolValue {
  return {
    id: 'pool-a',
    name: 'Draft Pool',
    slug: 'pool-a',
    channelId: '',
    status: 'PRE_DRAFT',
    draftStart: '',
    draftEnd: '',
    orderProgression: 'snake',
    sequentialTurns: true,
    pickTimerEnabled: true,
    pickTimerMinutes: 60,
    useRandomSeeding: true,
    picksVisibleTo: 'everyone',
    allowDuplicates: false,
    allowRemovals: false,
    teams: [],
    ...overrides,
  };
}

function context(overrides: Partial<QuickSetupContext> = {}): QuickSetupContext {
  return {
    settings: EMPTY_SETTINGS,
    pools: [pool()],
    format: 'Singles',
    ...overrides,
  };
}

function question(id: QuickSetupId) {
  return QUICK_SETUP.find((entry) => entry.id === id)!;
}

describe('quick setup', () => {
  describe('draft style', () => {
    const style = question('draftStyle');

    it('reads turns with unique picks as traditional and the opposite as open', () => {
      expect(style.current(context())).toBe('traditional');
      expect(
        style.current(
          context({
            pools: [pool({ sequentialTurns: false, allowDuplicates: true })],
          }),
        ),
      ).toBe('open');
    });

    it('reads a mix as custom', () => {
      expect(
        style.current(context({ pools: [pool({ allowDuplicates: true })] })),
      ).toBeNull();
      expect(
        style.current(
          context({
            pools: [pool(), pool({ id: 'b', sequentialTurns: false, allowDuplicates: true })],
          }),
        ),
      ).toBeNull();
    });

    it('applies open as no turns with shared Pokémon', () => {
      expect(style.apply('open')).toEqual({
        pools: { sequentialTurns: false, allowDuplicates: true },
      });
    });

    it('is locked once any draft has started', () => {
      expect(
        style.unavailable?.(context({ pools: [pool({ status: 'IN_PROGRESS' })] })),
      ).toMatch(/started/);
      expect(style.unavailable?.(context({ pools: [] }))).toMatch(/pool/);
    });
  });

  describe('draft pace', () => {
    const pace = question('draftPace');

    it('splits live and slow by the pick timer', () => {
      expect(pace.current(context({ pools: [pool({ pickTimerMinutes: 5 })] }))).toBe('live');
      expect(pace.current(context({ pools: [pool({ pickTimerMinutes: 600 })] }))).toBe('slow');
      expect(
        pace.current(context({ pools: [pool({ pickTimerEnabled: false })] })),
      ).toBe('untimed');
    });

    it('sets the timer for each pace', () => {
      expect(pace.apply('live').pools?.pickTimerMinutes).toBe(LIVE_PICK_MINUTES);
      expect(pace.apply('slow').pools?.pickTimerMinutes).toBe(SLOW_PICK_MINUTES);
      expect(pace.apply('untimed').pools).toEqual({ pickTimerEnabled: false });
    });

    it('has nothing to set for an open draft', () => {
      expect(
        pace.unavailable?.(
          context({ pools: [pool({ sequentialTurns: false, allowDuplicates: true })] }),
        ),
      ).toMatch(/no turns/);
    });
  });

  describe('scoring', () => {
    const scoring = question('scoring');

    it('recommends doubles scoring for a doubles tier list', () => {
      expect(scoring.recommended?.(context({ format: 'VGC' }))).toBe('game');
      expect(scoring.recommended?.(context({ format: 'Singles' }))).toBe('pokemon');
      expect(scoring.recommended?.(context({ format: '' }))).toBeNull();
    });

    it('sets the differential', () => {
      expect(scoring.apply('game')).toEqual({ settings: { diffMode: 'game' } });
    });
  });
});
