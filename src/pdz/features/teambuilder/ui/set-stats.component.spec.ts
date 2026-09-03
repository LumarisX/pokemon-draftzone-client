import { ComponentFixture, TestBed } from '@angular/core/testing';
import { calcStat, getStatSystem } from '@pdz/sets';
import { of } from 'rxjs';
import type { SpeciesBuildData } from '../data/teambuilder.models';
import { TeambuilderService } from '../data/teambuilder.service';
import { TeamStore } from '../state/team-store';
import { SetStatsComponent } from './set-stats.component';

const GARCHOMP: SpeciesBuildData = {
  id: 'garchomp',
  name: 'Garchomp',
  abilities: ['Rough Skin'],
  items: [],
  types: ['Dragon', 'Ground'],
  baseStats: { hp: 108, atk: 130, def: 95, spa: 80, spd: 85, spe: 102 },
  genders: ['M', 'F'],
  statSystem: 'evs',
  statRules: { ...getStatSystem('evs') },
};

function hpFor(evs: number): number {
  return calcStat('hp', GARCHOMP.baseStats.hp, 31, evs, 100);
}

describe('SetStatsComponent HP constraints', () => {
  let fixture: ComponentFixture<SetStatsComponent>;
  let component: SetStatsComponent & {
    toggleConstraint(divisor: number): void;
    setPoints(stat: 'hp', value: number): void;
    isConstrained(divisor: number): boolean;
    setResidue(residue: -1 | 0 | 1): void;
    setHpNotch(index: number): void;
    setNotch(stat: string, index: number): void;
    hpNotches(): number[];
    hpNotchIndex(): number;
    rows(): { stat: string; notches: number[]; notchTones: string[] }[];
  };
  let store: TeamStore;

  beforeEach(async () => {
    localStorage.clear();
    const service = {
      getSpecies: jest.fn(),
      getLearnset: jest.fn(),
      listTeams: jest.fn().mockReturnValue(of([])),
      createTeam: jest.fn().mockImplementation((p) => of({ ...team, ...p })),
      saveTeam: jest.fn().mockImplementation((_s, p) => of({ ...team, ...p })),
      deleteTeam: jest.fn(),
    } as unknown as TeambuilderService;

    const team = {
      slug: 'abc123',
      name: '',
      ruleset: 'Gen9 NatDex',
      level: 100,
      context: { type: 'matchup', id: 'm1' },
      sets: [],
      issues: [],
    };

    await TestBed.configureTestingModule({
      imports: [SetStatsComponent],
      providers: [
        TeamStore,
        { provide: TeambuilderService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetStatsComponent);
    component = fixture.componentInstance as typeof component;
    store = TestBed.inject(TeamStore);

    await store.load({ type: 'matchup', id: 'm1' }, 'Gen9 NatDex', 100);
    store.rememberSpecies(GARCHOMP);
    store.addSet('garchomp');
    fixture.detectChanges();
  });

  it('sanity-checks the base HP values the notches rely on', () => {
    expect(hpFor(0)).toBe(357);
    expect(hpFor(16)).toBe(361);
    expect(hpFor(48)).toBe(369);
  });

  describe('at level 100, where every 4 EVs changes HP', () => {
    it('halves the notch count as the divisor doubles', () => {
      expect(component.hpNotches()).toHaveLength(64);

      component.toggleConstraint(2);
      expect(component.hpNotches()).toHaveLength(33);

      component.toggleConstraint(4);
      expect(component.hpNotches()).toHaveLength(17);

      component.toggleConstraint(8);
      expect(component.hpNotches()).toHaveLength(10);

      component.toggleConstraint(16);
      expect(component.hpNotches()).toHaveLength(6);
    });
  });

  describe('at level 50, where HP only moves every 8 EVs', () => {
    beforeEach(() => {
      store.updateActive((set) => ({ ...set, level: 50 }));
    });

    it('drops duplicate EV values that buy no HP', () => {
      expect(component.hpNotches()).toHaveLength(33);

      component.toggleConstraint(2);
      expect(component.hpNotches()).toHaveLength(17);

      component.toggleConstraint(4);
      expect(component.hpNotches()).toHaveLength(10);

      component.toggleConstraint(8);
      expect(component.hpNotches()).toHaveLength(6);

      component.toggleConstraint(16);
      expect(component.hpNotches()).toHaveLength(4);
    });

    it('only the first step costs 4 EVs; the rest cost 8', () => {
      const notches = component.hpNotches();

      expect(notches.slice(0, 4)).toEqual([0, 4, 12, 20]);
    });

    it('never offers two notches with the same HP', () => {
      const seen = component
        .hpNotches()
        .map((points) => calcStat('hp', GARCHOMP.baseStats.hp, 31, points, 50));

      expect(new Set(seen).size).toBe(seen.length);
    });
  });

  describe('endpoints', () => {
    it('always offers zero and full investment, whatever the constraint', () => {
      for (const divisor of [2, 4, 8, 10, 16]) {
        component.toggleConstraint(divisor);
        const notches = component.hpNotches();

        expect(notches[0]).toBe(0);
        expect(notches[notches.length - 1]).toBe(252);
        component.toggleConstraint(divisor);
      }
    });

    it('keeps the endpoints even when they break the constraint', () => {
      component.toggleConstraint(16);
      const notches = component.hpNotches();

      expect(hpFor(0) % 16).not.toBe(1);
      expect(notches).toContain(0);
      expect(notches).toContain(252);
    });
  });

  describe('every stat', () => {
    it('gets notches, not just HP', () => {
      for (const row of component.rows()) {
        expect(row.notches.length).toBeGreaterThan(1);
        expect(row.notches[0]).toBe(0);
        expect(row.notches[row.notches.length - 1]).toBe(252);
      }
    });

    it('exposes a tone per notch for the slider to colour', () => {
      for (const row of component.rows()) {
        expect(row.notchTones).toHaveLength(row.notches.length);
        expect(new Set(row.notchTones)).toEqual(new Set(['neutral']));
      }
    });

    it('moves a non-HP stat only between its notches', () => {
      const before = component.rows().find((row) => row.stat === 'atk')!;
      component.setNotch('atk', 3);

      expect(store.activeSet()!.evs.atk).toBe(before.notches[3]);
    });

    it('snaps a typed non-HP value onto a notch', () => {
      component.setPoints('atk' as 'hp', 6);

      expect(store.activeSet()!.evs.atk).toBe(4);
    });
  });

  it('every notch but the endpoints satisfies the active constraint', () => {
    component.toggleConstraint(16);
    const notches = component.hpNotches();

    for (const points of notches.slice(1, -1)) {
      expect(hpFor(points) % 16).toBe(1);
    }
  });

  it('moves only between notches', () => {
    component.toggleConstraint(16);

    component.setHpNotch(0);
    expect(store.activeSet()!.evs.hp).toBe(component.hpNotches()[0]);

    component.setHpNotch(2);
    expect(store.activeSet()!.evs.hp).toBe(component.hpNotches()[2]);
    expect(store.activeStats()!.hp % 16).toBe(1);
  });

  it('ignores an out-of-range notch index', () => {
    const before = store.activeSet()!.evs.hp;
    component.setHpNotch(999);

    expect(store.activeSet()!.evs.hp).toBe(before);
  });

  it('reports the index of the current value', () => {
    component.toggleConstraint(16);
    component.setHpNotch(3);

    expect(component.hpNotchIndex()).toBe(3);
  });

  it('still lands on a notch while unconstrained', () => {
    component.setPoints('hp', 6);

    expect(store.activeSet()!.evs.hp).toBe(4);
  });

  it('stays on zero when a constraint is applied, since zero is always kept', () => {
    component.toggleConstraint(16);

    expect(store.activeSet()!.evs.hp).toBe(0);
  });

  it('snaps a mid-range value onto the constrained notch', () => {
    component.setPoints('hp', 60);
    component.toggleConstraint(16);

    expect(store.activeSet()!.evs.hp).toBe(48);
    expect(store.activeStats()!.hp % 16).toBe(1);
  });

  it('keeps a value that already satisfies the milestone', () => {
    component.toggleConstraint(4);

    expect(store.activeSet()!.evs.hp).toBe(0);
    expect(store.activeStats()!.hp % 4).toBe(1);
  });

  it('constrains subsequent slider moves', () => {
    component.toggleConstraint(16);
    component.setPoints('hp', 100);

    expect(store.activeSet()!.evs.hp).toBe(112);
    expect(store.activeStats()!.hp % 16).toBe(1);
  });

  it('snaps to a different value for each milestone', () => {
    component.setPoints('hp', 20);

    component.toggleConstraint(8);
    expect(store.activeSet()!.evs.hp).toBe(16);
    expect(store.activeStats()!.hp % 8).toBe(1);
  });

  it('deselects by re-clicking the active milestone', () => {
    component.toggleConstraint(16);
    expect(component.isConstrained(16)).toBe(true);
    expect(component.hpNotches()).toHaveLength(6);

    component.toggleConstraint(16);

    expect(component.isConstrained(16)).toBe(false);
    expect(component.hpNotches()).toHaveLength(64);
  });

  it('switches directly between milestones', () => {
    component.toggleConstraint(16);
    component.toggleConstraint(8);

    expect(component.isConstrained(16)).toBe(false);
    expect(component.isConstrained(8)).toBe(true);
  });

  it('offers 10 as a milestone', () => {
    component.toggleConstraint(10);

    for (const points of component.hpNotches().slice(1, -1)) {
      expect(hpFor(points) % 10).toBe(1);
    }
  });

  describe('residue', () => {
    it('defaults to one above a multiple', () => {
      component.toggleConstraint(16);

      for (const points of component.hpNotches().slice(1, -1)) {
        expect(hpFor(points) % 16).toBe(1);
      }
    });

    it('matches exact multiples at 0', () => {
      component.toggleConstraint(16);
      component.setResidue(0);

      for (const points of component.hpNotches().slice(1, -1)) {
        expect(hpFor(points) % 16).toBe(0);
      }
    });

    it('matches one below a multiple at -1', () => {
      component.toggleConstraint(16);
      component.setResidue(-1);

      for (const points of component.hpNotches().slice(1, -1)) {
        expect(hpFor(points) % 16).toBe(15);
      }
    });

    it('re-snaps the current value when the residue changes', () => {
      component.setPoints('hp', 60);
      component.toggleConstraint(16);
      const atPlusOne = store.activeSet()!.evs.hp;

      component.setResidue(0);

      expect(store.activeSet()!.evs.hp).not.toBe(atPlusOne);
      expect(store.activeStats()!.hp % 16).toBe(0);
    });
  });

  it('never exceeds the per-stat cap while snapping', () => {
    component.toggleConstraint(16);
    component.setPoints('hp', 999);

    expect(store.activeSet()!.evs.hp).toBe(252);
  });
});
