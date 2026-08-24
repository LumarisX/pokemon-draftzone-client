import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { DraftPokemon } from '../../../../draft.model';
import { Speedtier } from '../../../matchup-interface';
import { SpeedtierComponent } from '../speedtier/speedtier.component';

export type SpeedtierGroup = {
  tiers: Speedtier[];
  pokemon: DraftPokemon[];
};

@Component({
  selector: 'pdz-speedtier-group',
  templateUrl: './speedtier-group.component.html',
  styleUrl: './speedtier-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpriteComponent, SpeedtierComponent],
  host: {
    class: 'speedtier-group',
    '[class.speedtier-group--opponent]': 'opponent()',
    '[class.speedtier-group--collapsible]': 'collapsible()',
    '[attr.role]': 'collapsible() ? "button" : null',
    '[attr.tabindex]': 'collapsible() ? 0 : null',
    '[attr.aria-expanded]': 'collapsible() ? expanded() : null',
    '[attr.aria-label]': 'toggleLabel()',
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': 'toggle($event)',
  },
})
export class SpeedtierGroupComponent {
  readonly group = input.required<SpeedtierGroup>();

  private readonly opened = signal(false);

  protected readonly tiers = computed(() => this.group().tiers);
  protected readonly collapsible = computed(() => this.tiers().length > 1);
  protected readonly expanded = computed(
    () => !this.collapsible() || this.opened(),
  );
  protected readonly opponent = computed(() => this.tiers()[0].team === 1);
  protected readonly topSpeed = computed(() => this.tiers()[0].speed);
  protected readonly bottomSpeed = computed(
    () => this.tiers()[this.tiers().length - 1].speed,
  );
  protected readonly ranged = computed(
    () => this.bottomSpeed() !== this.topSpeed(),
  );
  protected readonly toggleLabel = computed(() =>
    this.collapsible()
      ? `${this.tiers().length} speed tiers from ${this.topSpeed()} to ${this.bottomSpeed()}`
      : null,
  );

  protected toggle(event?: Event) {
    if (!this.collapsible()) return;
    event?.preventDefault();
    this.opened.update((opened) => !opened);
  }
}
