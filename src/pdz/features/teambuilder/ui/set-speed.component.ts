import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MAX_IV, setNature, Stat } from '@pdz/sets';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TeamStore } from '../state/team-store';
import type { OpponentPokemon } from '../teambuilder.context';

export interface SpeedTier {
  readonly key: string;
  readonly pokemon: { id: string; name: string; shiny?: boolean };
  readonly speed: number;
  readonly modifiers: string[];
  readonly mine: boolean;
  readonly setIndex: number;
}

@Component({
  selector: 'pdz-set-speed',
  templateUrl: './set-speed.component.html',
  styleUrl: './set-speed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    CdkDrag,
    CdkDropList,
    ChipComponent,
    EmptyStateComponent,
    SpriteComponent,
  ],
})
export class SetSpeedComponent {
  readonly opponent = input<readonly OpponentPokemon[]>([]);

  protected readonly store = inject(TeamStore);

  protected readonly modifiers = computed(() => {
    const seen = new Set<string>();
    for (const pokemon of this.opponent()) {
      for (const tier of pokemon.tiers ?? []) {
        for (const modifier of tier.modifiers) seen.add(modifier);
      }
    }
    return [...seen].sort(compareModifiers);
  });

  protected readonly shown = linkedSignal<
    readonly string[],
    ReadonlySet<string>
  >({
    source: this.modifiers,
    computation: (modifiers) => new Set(modifiers.filter(isSpread)),
  });

  protected readonly spreads = computed(() =>
    this.modifiers().filter(isSpread),
  );

  protected readonly extras = computed(() =>
    this.modifiers().filter((modifier) => !isSpread(modifier)),
  );

  protected readonly filtersOpen = signal(false);

  protected readonly allShown = computed(() =>
    this.modifiers().every((modifier) => this.shown().has(modifier)),
  );

  protected readonly tiers = computed<SpeedTier[]>(() => {
    const on = this.shown();
    const theirs: SpeedTier[] = [];

    for (const pokemon of this.opponent()) {
      for (const [index, tier] of (pokemon.tiers ?? []).entries()) {
        if (!tier.modifiers.every((modifier) => on.has(modifier))) continue;
        theirs.push({
          key: `them:${pokemon.id}:${index}`,
          pokemon: {
            id: pokemon.id,
            name: pokemon.name,
            shiny: pokemon.shiny,
          },
          speed: tier.speed,
          modifiers: tier.modifiers,
          mine: false,
          setIndex: -1,
        });
      }
    }

    const mine = this.store.sets().map((set, index) => {
      const stats = this.store.statsFor(index);
      return {
        key: `me:${index}`,
        pokemon: {
          id: set.id,
          name: this.store.displayName(set),
          shiny: set.shiny,
        },
        speed: stats?.spe ?? 0,
        modifiers: [this.spreadLabel(index)],
        mine: true,
        setIndex: index,
      };
    });

    return [...theirs, ...mine].sort((a, b) => b.speed - a.speed);
  });

  protected isShown(modifier: string): boolean {
    return this.shown().has(modifier);
  }

  protected toggleModifier(modifier: string): void {
    const next = new Set(this.shown());
    if (next.has(modifier)) next.delete(modifier);
    else next.add(modifier);
    this.shown.set(next);
  }

  protected toggleAll(): void {
    this.shown.set(
      this.allShown()
        ? new Set(this.modifiers().filter(isSpread))
        : new Set(this.modifiers()),
    );
  }

  protected drop(event: CdkDragDrop<SpeedTier[]>): void {
    const tier = event.item.data as SpeedTier;
    if (!tier?.mine) return;

    const list = this.tiers().filter((entry) => entry.key !== tier.key);
    const below = list[event.currentIndex];
    const above = list[event.currentIndex - 1];

    const target = below
      ? below.speed + 1
      : above
        ? Math.max(above.speed - 1, 0)
        : tier.speed;

    this.setSpeed(tier.setIndex, target);
  }

  private setSpeed(index: number, target: number): void {
    const ceiling = this.store.maxStatFor(index, 'spe');
    if (ceiling === null) return;

    if (target > ceiling) {
      const set = this.store.sets()[index];
      const nature = setNature(set);
      const drop: Stat =
        nature && nature.boost !== nature.drop && nature.drop !== 'spe'
          ? nature.drop
          : 'atk';
      this.store.setNatureAt(index, 'spe', drop);
    }

    this.store.setTargetStatAt(index, 'spe', target);
  }

  private spreadLabel(index: number): string {
    const set = this.store.sets()[index];
    const rules = this.store.statRules();
    const points = rules.field === 'sps' ? set.sps.spe : set.evs.spe;
    const nature = setNature(set);

    let label = `${points}`;
    if (nature && nature.boost !== nature.drop) {
      if (nature.boost === 'spe') label += '+';
      else if (nature.drop === 'spe') label += '-';
    }
    if (rules.usesIvs && set.ivs.spe < MAX_IV) {
      label += ` ${set.ivs.spe} IVs`;
    }
    return label;
  }
}

const SPREAD = /^(\d+)[+-]?(\s+\d+\s*ivs)?$/i;

function isSpread(modifier: string): boolean {
  return SPREAD.test(modifier.trim());
}

function compareModifiers(a: string, b: string): number {
  const spreadA = isSpread(a);
  const spreadB = isSpread(b);
  if (spreadA !== spreadB) return spreadA ? -1 : 1;
  if (spreadA && spreadB) {
    const points = (value: string) =>
      Number(SPREAD.exec(value.trim())?.[1] ?? 0);
    return points(b) - points(a) || a.localeCompare(b);
  }
  return a.localeCompare(b);
}
