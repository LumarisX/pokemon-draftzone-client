import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  baseStat,
  calcStat,
  hpMilestones,
  HpResidue,
  HP_MILESTONES,
  isJumpPoint,
  matchesMilestone,
  MAX_IV,
  maxStat,
  minStat,
  Nature,
  setNature,
  Stat,
  StatSystem,
  STATS,
} from '@pdz/sets';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import {
  SliderComponent,
  SliderTickTone,
} from '@pdz/shared/inputs/slider/slider.component';
import { TeamStore } from '../state/team-store';

type StatTone = 'high' | 'low' | 'neutral';

export interface StatRow {
  readonly stat: Stat;
  readonly name: string;
  readonly full: string;
  readonly base: number;
  readonly value: number;
  readonly points: number;
  readonly iv: number;
  readonly floor: number;
  readonly neutral: number;
  readonly ceiling: number;
  readonly boosted: boolean;
  readonly dropped: boolean;
  readonly tone: StatTone;
  readonly atJumpPoint: boolean;
  readonly wasted: number;
  readonly modified: boolean;
  readonly milestones: readonly number[];
  readonly notches: number[];
  readonly notchIndex: number;
  readonly notchTones: SliderTickTone[];
}

@Component({
  selector: 'pdz-set-stats',
  templateUrl: './set-stats.component.html',
  styleUrl: './set-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    IconComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    SliderComponent,
  ],
})
export class SetStatsComponent {
  protected readonly store = inject(TeamStore);
  protected readonly maxIv = MAX_IV;
  protected readonly milestones = HP_MILESTONES;
  protected readonly hpDivisor = signal<number>(NO_DIVISOR);
  protected readonly hpResidue = signal<HpResidue>(1);

  protected readonly rows = computed<StatRow[]>(() => {
    const set = this.store.activeSet();
    const species = this.store.activeSpecies();
    const stats = this.store.activeStats();
    const rules = this.store.statRules();
    if (!set || !species || !stats) return [];

    const nature = setNature(set);
    const points = rules.field === 'sps' ? set.sps : set.evs;
    const divisor = this.hpDivisor();
    const residue = this.hpResidue();

    return STATS.map(({ id, name, full }) => {
      const base = species.baseStats[id];
      const value = stats[id];
      const neutral = baseStat(id, base, set.level, nature);
      const notches = buildNotches({
        stat: id,
        base,
        iv: set.ivs[id],
        level: set.level,
        nature,
        rules,
        keep:
          id === 'hp' && divisor > NO_DIVISOR
            ? (hp) => matchesMilestone(hp, divisor, residue)
            : () => true,
      });

      return {
        stat: id,
        name,
        full,
        base,
        value,
        points: points[id],
        iv: set.ivs[id],
        floor: minStat(id, base, set.level, nature),
        neutral,
        ceiling: maxStat(id, base, set.level, rules, nature),
        boosted: nature?.boost === id && nature.drop !== id,
        dropped: nature?.drop === id && nature.boost !== id,
        tone: value > neutral ? 'high' : value < neutral ? 'low' : 'neutral',
        atJumpPoint: isJumpPoint(value - 1, id, nature),
        wasted: points[id] % rules.granularity,
        modified: points[id] > 0 || set.ivs[id] < MAX_IV,
        milestones: id === 'hp' ? hpMilestones(value, residue) : [],
        notches,
        notchIndex: nearestIndex(notches, points[id]),
        notchTones: notches.map(() => 'neutral' as SliderTickTone),
      };
    });
  });

  protected readonly overspent = computed(() => this.store.remaining() < 0);

  protected readonly hpRow = computed(() =>
    this.rows().find((row) => row.stat === 'hp'),
  );

  protected hpNotches(): number[] {
    return this.hpRow()?.notches ?? [];
  }

  protected hpNotchIndex(): number {
    return this.hpRow()?.notchIndex ?? 0;
  }

  protected setNotch(stat: Stat, index: number): void {
    const points = this.rowFor(stat)?.notches[Math.round(index)];
    if (points === undefined) return;
    this.store.setPoints(stat, points);
  }

  protected setHpNotch(index: number): void {
    this.setNotch('hp', index);
  }

  protected setPoints(stat: Stat, value: number): void {
    const notches = this.rowFor(stat)?.notches ?? [];
    if (notches.length === 0) {
      this.store.setPoints(stat, value);
      return;
    }
    this.store.setPoints(stat, notches[nearestIndex(notches, value)]!);
  }

  protected notchLabel(row: StatRow): string {
    const count = row.notches.length;
    return `${row.full}: ${count} reachable ${count === 1 ? 'value' : 'values'}`;
  }

  protected toggleConstraint(divisor: number): void {
    this.hpDivisor.set(this.hpDivisor() === divisor ? NO_DIVISOR : divisor);
    this.reSnapHp();
  }

  protected setResidue(residue: HpResidue): void {
    this.hpResidue.set(residue);
    this.reSnapHp();
  }

  protected isConstrained(divisor: number): boolean {
    return this.hpDivisor() === divisor;
  }

  protected get constrained(): boolean {
    return this.hpDivisor() > NO_DIVISOR;
  }

  protected residueLabel(divisor: number): string {
    const residue = this.hpResidue();
    if (residue === 0) return `a multiple of ${divisor}`;
    if (residue === 1) return `1 above a multiple of ${divisor}`;
    return `1 below a multiple of ${divisor}`;
  }

  private reSnapHp(): void {
    const row = this.hpRow();
    if (!row) return;
    const snapped = row.notches[nearestIndex(row.notches, row.points)];
    if (snapped !== undefined && snapped !== row.points) {
      this.store.setPoints('hp', snapped);
    }
  }

  protected setIv(stat: Stat, value: string): void {
    const iv = Number.parseInt(value, 10);
    if (Number.isNaN(iv)) return;
    this.store.setIv(stat, iv);
  }

  protected setTarget(stat: Stat, value: string): void {
    const target = Number.parseInt(value, 10);
    if (Number.isNaN(target)) return;
    this.store.setTargetStat(stat, target);
  }

  protected boost(stat: Stat): void {
    const set = this.store.activeSet();
    if (!set) return;
    const nature = setNature(set);
    const active = nature && nature.boost !== nature.drop;

    if (active && nature.boost === stat) {
      this.store.setNature(stat, stat);
      return;
    }

    const drop =
      active && nature.drop !== stat ? nature.drop : counterpart(stat);
    this.store.setNature(stat, drop);
  }

  protected drop(stat: Stat): void {
    const set = this.store.activeSet();
    if (!set) return;
    const nature = setNature(set);
    const active = nature && nature.boost !== nature.drop;

    if (active && nature.drop === stat) {
      this.store.setNature(stat, stat);
      return;
    }

    const boost =
      active && nature.boost !== stat ? nature.boost : counterpart(stat);
    this.store.setNature(boost, stat);
  }

  protected reset(stat: Stat): void {
    this.store.setPoints(stat, 0);
    this.store.setIv(stat, MAX_IV);
  }

  protected hasMilestone(row: StatRow, divisor: number): boolean {
    return row.milestones.includes(divisor);
  }

  private rowFor(stat: Stat): StatRow | undefined {
    return this.rows().find((row) => row.stat === stat);
  }
}

const NO_DIVISOR = 0;

export function buildNotches(options: {
  stat: Stat;
  base: number;
  iv: number;
  level: number;
  nature: Nature | undefined;
  rules: StatSystem;
  keep: (value: number) => boolean;
}): number[] {
  const { stat, base, iv, level, nature, rules, keep } = options;
  const seen = new Set<number>();
  const reachable: { points: number; value: number }[] = [];

  for (
    let points = 0;
    points <= rules.perStatMax;
    points += rules.granularity
  ) {
    const value = calcStat(
      stat,
      base,
      rules.usesIvs ? iv : MAX_IV,
      rules.toEv(points),
      level,
      nature,
    );
    if (seen.has(value)) continue;
    seen.add(value);
    reachable.push({ points, value });
  }

  if (reachable.length === 0) return [];

  const kept = new Set(
    reachable.filter((entry) => keep(entry.value)).map((entry) => entry.points),
  );
  kept.add(reachable[0]!.points);
  kept.add(reachable[reachable.length - 1]!.points);

  return [...kept].sort((a, b) => a - b);
}

function nearestIndex(values: readonly number[], target: number): number {
  if (values.length === 0) return 0;
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [index, value] of values.entries()) {
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

function counterpart(stat: Stat): Stat {
  return stat === 'atk' ? 'spa' : 'atk';
}
