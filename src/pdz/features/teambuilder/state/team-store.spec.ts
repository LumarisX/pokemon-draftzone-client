import { TestBed } from '@angular/core/testing';
import { createSet, getStatSystem, PokemonSet } from '@pdz/sets';
import { of, throwError } from 'rxjs';
import type { SpeciesBuildData, Team } from '../data/teambuilder.models';
import { TeambuilderService } from '../data/teambuilder.service';
import { TeamStore } from './team-store';

const GARCHOMP: SpeciesBuildData = {
  id: 'garchomp',
  name: 'Garchomp',
  abilities: ['Rough Skin', 'Sand Veil'],
  items: [],
  types: ['Dragon', 'Ground'],
  baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
  genders: ['M', 'F'],
  statSystem: 'evs',
  statRules: { ...getStatSystem('evs') },
};

const CHAMPIONS_GARCHOMP: SpeciesBuildData = {
  ...GARCHOMP,
  statSystem: 'statPoints',
  statRules: { ...getStatSystem('statPoints') },
};

function team(sets: PokemonSet[], slug = 'abc123'): Team {
  return {
    slug,
    name: '',
    ruleset: 'Gen9 NatDex',
    level: 100,
    context: { type: 'matchup', id: 'm1' },
    sets,
    issues: [],
  };
}

describe('TeamStore', () => {
  let service: jest.Mocked<TeambuilderService>;
  let store: TeamStore;

  beforeEach(() => {
    localStorage.clear();
    service = {
      getSpecies: jest.fn(),
      getLearnset: jest.fn(),
      listTeams: jest.fn().mockReturnValue(of([])),
      createTeam: jest.fn().mockImplementation((payload) =>
        of(team([...payload.sets])),
      ),
      saveTeam: jest.fn().mockImplementation((slug, payload) =>
        of(team([...payload.sets], slug)),
      ),
      deleteTeam: jest.fn().mockReturnValue(of({ deleted: true })),
    } as unknown as jest.Mocked<TeambuilderService>;

    TestBed.configureTestingModule({
      providers: [TeamStore, { provide: TeambuilderService, useValue: service }],
    });
    store = TestBed.inject(TeamStore);
  });

  describe('load', () => {
    it('adopts the first team returned for the context', async () => {
      service.listTeams.mockReturnValue(
        of([team([createSet({ id: 'garchomp' })])]),
      );

      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(service.listTeams).toHaveBeenCalledWith('matchup', 'm1');
      expect(store.sets()).toHaveLength(1);
      expect(store.sets()[0].id).toBe('garchomp');
    });

    it('is idempotent for the same context', async () => {
      const context = { type: 'matchup' as const, id: 'm1' };

      await Promise.all([
        store.load(context, 'Gen9 NatDex', 100),
        store.load(context, 'Gen9 NatDex', 100),
      ]);
      await store.load(context, 'Gen9 NatDex', 100);

      expect(service.listTeams).toHaveBeenCalledTimes(1);
      expect(service.createTeam).not.toHaveBeenCalled();
    });

    it('reloads when the context changes', async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      await store.load({ type: 'matchup', id: 'm2' }, 'Gen9 NatDex', 100);

      expect(service.listTeams).toHaveBeenCalledTimes(2);
    });

    it('starts empty when the context has no team', async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(store.sets()).toEqual([]);
      expect(store.activeIndex()).toBe(0);
    });
  });

  describe('legacy migration', () => {
    it('uploads a localStorage team and clears the key', async () => {
      localStorage.setItem(
        'matchup_teambuilder',
        JSON.stringify({
          m1: {
            team: [
              {
                id: 'garchomp',
                ability: 'Rough Skin',
                item: 'Choice Band',
                moves: ['Earthquake', 'Dragon Claw'],
                stats: { atk: { evs: 252, ivs: 31 } },
              },
            ],
          },
        }),
      );

      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(service.createTeam).toHaveBeenCalledTimes(1);
      const uploaded = service.createTeam.mock.calls[0][0];
      expect(uploaded.context).toEqual({ type: 'matchup', id: 'm1' });
      expect(uploaded.sets[0]).toMatchObject({
        id: 'garchomp',
        ability: 'roughskin',
        item: 'choiceband',
      });
      expect(uploaded.sets[0].moves).toEqual([
        'earthquake',
        'dragonclaw',
        null,
        null,
      ]);
      expect(uploaded.sets[0].evs.atk).toBe(252);
      expect(localStorage.getItem('matchup_teambuilder')).toBeNull();
    });

    it('keeps the legacy key when the upload fails', async () => {
      localStorage.setItem(
        'matchup_teambuilder',
        JSON.stringify({ m1: { team: [{ id: 'garchomp' }] } }),
      );
      service.createTeam.mockReturnValue(throwError(() => new Error('offline')));

      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(localStorage.getItem('matchup_teambuilder')).not.toBeNull();
    });

    it('does nothing when there is no legacy team', async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(service.createTeam).not.toHaveBeenCalled();
    });
  });

  describe('derived state', () => {
    beforeEach(async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      store.rememberSpecies(GARCHOMP);
      store.addSet('garchomp');
    });

    it('defaults the ability to the species first ability id', () => {
      expect(store.activeSet()?.ability).toBe('roughskin');
    });

    it('computes stats from the species base stats', () => {
      store.setNature('atk', 'spa');
      store.setPoints('atk', 252);

      expect(store.activeStats()?.atk).toBe(394);
      expect(store.activeStats()?.hp).toBe(357);
    });

    it('tracks spent and remaining points', () => {
      store.setPoints('atk', 252);
      store.setPoints('spe', 252);

      expect(store.spent()).toBe(504);
      expect(store.remaining()).toBe(6);
    });

    it('reports wasted EVs as they are spent', () => {
      store.setPoints('hp', 6);

      expect(store.wasted()).toBe(2);
      expect(store.activeIssues().map((issue) => issue.code)).toContain(
        'points.wasted',
      );
    });

    it('sets a stat by target value', () => {
      store.setTargetStat('spe', 300);

      expect(store.activeStats()!.spe).toBeGreaterThanOrEqual(300);
    });

    it('switches to the stat-point system when the species says so', () => {
      store.rememberSpecies(CHAMPIONS_GARCHOMP);

      expect(store.statRules().id).toBe('statPoints');
      expect(store.remaining()).toBe(66);

      store.setPoints('atk', 32);
      expect(store.activeSet()?.sps.atk).toBe(32);
      expect(store.activeSet()?.evs.atk).toBe(0);
      expect(store.activeStats()?.atk).toBe(359);
    });

    it('clamps points to the active system cap', () => {
      store.setPoints('atk', 999);
      expect(store.activeSet()?.evs.atk).toBe(252);

      store.rememberSpecies(CHAMPIONS_GARCHOMP);
      store.setPoints('def', 999);
      expect(store.activeSet()?.sps.def).toBe(32);
    });
  });

  describe('indexed operations', () => {
    beforeEach(async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      store.rememberSpecies(GARCHOMP);
      store.addSet('garchomp');
      store.addSet('garchomp');
    });

    it('computes stats for a set that is not active', () => {
      store.activeIndex.set(0);
      store.setTargetStatAt(1, 'spe', 300);

      expect(store.statsFor(1)!.spe).toBeGreaterThanOrEqual(300);
      expect(store.statsFor(0)!.spe).toBeLessThan(300);
      expect(store.activeIndex()).toBe(0);
    });

    it('reports the speed ceiling for a set', () => {
      expect(store.maxStatFor(0, 'spe')).toBe(303);

      store.setNatureAt(0, 'spe', 'atk');

      expect(store.maxStatFor(0, 'spe')).toBe(333);
    });

    it('returns null for a set with no species loaded', () => {
      store.addSet('dragonite');

      expect(store.statsFor(2)).toBeNull();
      expect(store.maxStatFor(2, 'spe')).toBeNull();
    });

    it('sets a nature on a non-active set', () => {
      store.setNatureAt(1, 'spe', 'atk');

      expect(store.sets()[1].nature).toBe('Timid');
      expect(store.sets()[0].nature).toBeUndefined();
    });
  });

  describe('moves', () => {
    beforeEach(async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      store.rememberSpecies(GARCHOMP);
      store.addSet('garchomp');
    });

    it('assigns a move to a slot', () => {
      store.toggleMove(0, 'earthquake');

      expect(store.activeSet()?.moves).toEqual([
        'earthquake',
        null,
        null,
        null,
      ]);
    });

    it('removes a move already on the set rather than duplicating it', () => {
      store.toggleMove(0, 'earthquake');
      store.toggleMove(2, 'earthquake');

      expect(store.activeSet()?.moves).toEqual([null, null, null, null]);
    });
  });

  describe('roster', () => {
    beforeEach(async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      store.rememberSpecies(GARCHOMP);
    });

    it('reports which species are already on the team', () => {
      expect(store.hasSpecies('garchomp')).toBe(false);
      store.addSet('garchomp');
      expect(store.hasSpecies('garchomp')).toBe(true);
    });

    it('moves the active index back when the last set is removed', () => {
      store.addSet('garchomp');
      store.addSet('dragonite');
      store.activeIndex.set(1);

      store.removeSet(1);

      expect(store.sets()).toHaveLength(1);
      expect(store.activeIndex()).toBe(0);
    });
  });

  describe('sync', () => {
    beforeEach(async () => {
      await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
      store.rememberSpecies(GARCHOMP);
    });

    it('creates on the first flush and updates by slug afterwards', async () => {
      store.addSet('garchomp');
      await store.flush();

      expect(service.createTeam).toHaveBeenCalledTimes(1);
      expect(store.status()).toBe('saved');

      store.setPoints('atk', 252);
      await store.flush();

      expect(service.saveTeam).toHaveBeenCalledWith(
        'abc123',
        expect.objectContaining({ ruleset: 'Gen9 NatDex' }),
      );
    });

    it('caches the write and flags an error when saving fails', async () => {
      store.addSet('garchomp');
      await store.flush();

      service.saveTeam.mockReturnValue(throwError(() => new Error('offline')));
      store.setPoints('atk', 252);
      await store.flush();

      expect(store.status()).toBe('error');
      const cached = JSON.parse(
        localStorage.getItem('pdz_teambuilder_pending') ?? '{}',
      );
      expect(cached['abc123'].payload.sets[0].evs.atk).toBe(252);
    });

    it('replays a cached write on the next load', async () => {
      const pending = createSet({ id: 'garchomp', evs: { atk: 252 } as never });
      localStorage.setItem(
        'pdz_teambuilder_pending',
        JSON.stringify({
          abc123: {
            slug: 'abc123',
            at: Date.now(),
            payload: {
              context: { type: 'matchup', id: 'm1' },
              name: '',
              ruleset: 'Gen9 NatDex',
              level: 100,
              sets: [pending],
            },
          },
        }),
      );
      service.listTeams.mockReturnValue(of([team([], 'abc123')]));

      const fresh = TestBed.runInInjectionContext(() => new TeamStore());
      await fresh.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);

      expect(fresh.sets()).toHaveLength(1);
      expect(fresh.sets()[0].evs.atk).toBe(252);
    });

    it('does not save before a context is loaded', async () => {
      const fresh = TestBed.runInInjectionContext(() => new TeamStore());

      await expect(fresh.flush()).resolves.toBeUndefined();
      expect(service.createTeam).not.toHaveBeenCalled();
      expect(service.saveTeam).not.toHaveBeenCalled();
    });
  });
});
