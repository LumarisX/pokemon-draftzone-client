import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MAX_IV, setNature, Stat } from '@pdz/sets';
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

  private readonly hidden = signal<ReadonlySet<string>>(new Set());

  protected readonly modifiers = computed(() => {
    const seen = new Set<string>();
    for (const pokemon of this.opponent()) {
      for (const tier of pokemon.tiers ?? []) {
        for (const modifier of tier.modifiers) seen.add(modifier);
      }
    }
    return [...seen].sort();
  });

  protected readonly tiers = computed<SpeedTier[]>(() => {
    const off = this.hidden();
    const theirs: SpeedTier[] = [];

    for (const pokemon of this.opponent()) {
      for (const [index, tier] of (pokemon.tiers ?? []).entries()) {
        if (tier.modifiers.some((modifier) => off.has(modifier))) continue;
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
      const species = this.store.species().get(set.id);
      const stats = this.store.statsFor(index);
      return {
        key: `me:${index}`,
        pokemon: {
          id: set.id,
          name: set.nickname || species?.name || set.id,
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

  protected isHidden(modifier: string): boolean {
    return this.hidden().has(modifier);
  }

  protected toggleModifier(modifier: string): void {
    const next = new Set(this.hidden());
    if (next.has(modifier)) next.delete(modifier);
    else next.add(modifier);
    this.hidden.set(next);
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
