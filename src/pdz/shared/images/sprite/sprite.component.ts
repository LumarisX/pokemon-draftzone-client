import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SpriteImageComponent } from '../sprite-image/sprite-image.component';

type SpritePokemon = Pokemon<DraftOptions>;

type FormeSlot = {
  pokemon: SpritePokemon;
  index: number;
  transform: string;
  zIndex: number;
  isActive: boolean;
};

@Component({
  selector: 'pdz-sprite',
  imports: [SpriteImageComponent],
  templateUrl: './sprite.component.html',
  styleUrl: './sprite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpriteComponent {
  pokemon = input.required<SpritePokemon>();
  tooltipPosition = input<
    'before' | 'after' | 'above' | 'below' | 'left' | 'right' | null
  >(null);
  size = input<string>();
  flipped = input(false, { transform: booleanAttribute });
  disabled = model(false);
  showFormes = input(true, { transform: booleanAttribute });
  interactive = input(true, { transform: booleanAttribute });
  cycleDisabled = input(false, { transform: booleanAttribute });
  formeId = model<string | undefined>(undefined);
  formeIndex = model(0);
  loadedEvent = output<void>();
  cycled = output<void>();

  private readonly FRONT_SCALE = 1;
  private readonly SILHOUETTE_SPAN_X = 6;
  private readonly SILHOUETTE_SPAN_Y = 2;

  protected readonly formes = computed<SpritePokemon[]>(() => {
    const pokemon = this.pokemon();
    if (!this.showFormes() || !pokemon.draftFormes?.length) return [pokemon];
    return [
      pokemon,
      ...pokemon.draftFormes.map((forme) => ({
        ...forme,
        shiny: pokemon.shiny,
      })),
    ];
  });

  readonly activeForme = computed<SpritePokemon | undefined>(
    () => this.formes()[this.normalizedIndex()],
  );

  private readonly normalizedIndex = computed(() => {
    const count = this.formes().length;
    if (!count) return 0;
    return ((this.formeIndex() % count) + count) % count;
  });

  protected readonly slots = computed<FormeSlot[]>(() => {
    const formes = this.formes();
    const count = formes.length;
    if (!count) return [];
    const active = this.normalizedIndex();

    const side = this.flipped() ? -1 : 1;
    const spacingX = this.SILHOUETTE_SPAN_X / (count - 1 || 1);
    const spacingY = this.SILHOUETTE_SPAN_Y / (count - 1 || 1);
    return formes.map((pokemon, index) => {
      const slot = (index - active + count) % count;
      if (slot === 0) {
        return {
          pokemon,
          index,
          transform: `translate(0, 0) scale(${this.FRONT_SCALE})`,
          zIndex: count,
          isActive: true,
        };
      }
      const depth = slot;
      const x = side * depth * spacingX;
      const y = -depth * spacingY;
      return {
        pokemon,
        index,
        transform: `translate(${x}%, ${y}%) scale(1)`,
        zIndex: count - depth,
        isActive: false,
      };
    });
  });

  constructor() {
    let lastBaseId: string | undefined;
    effect(() => {
      const baseId = this.pokemon().id;
      if (lastBaseId !== undefined && lastBaseId !== baseId) {
        this.formeIndex.set(0);
      }
      lastBaseId = baseId;
    });

    effect(() => {
      const id = this.formeId();
      if (id === undefined) return;
      const index = this.formes().findIndex((forme) => forme.id === id);
      if (index >= 0 && index !== untracked(this.normalizedIndex)) {
        this.formeIndex.set(index);
      }
    });

    effect(() => {
      const id = this.activeForme()?.id;
      if (id && id !== untracked(this.formeId)) {
        this.formeId.set(id);
      }
    });
  }

  protected readonly stateCount = computed(
    () => this.formes().length + (this.cycleDisabled() ? 1 : 0),
  );

  next(): void {
    this.step(1);
  }

  previous(): void {
    this.step(-1);
  }

  step(direction: 1 | -1 = 1): void {
    const formeCount = this.formes().length;
    const stateCount = this.stateCount();
    if (stateCount < 2) return;

    const position =
      this.cycleDisabled() && this.disabled()
        ? formeCount
        : this.normalizedIndex();
    const next =
      (((position + direction) % stateCount) + stateCount) % stateCount;

    if (this.cycleDisabled()) {
      const nowDisabled = next === formeCount;
      this.disabled.set(nowDisabled);
      this.formeIndex.set(nowDisabled ? 0 : next);
    } else {
      this.formeIndex.set(next);
    }
    this.cycled.emit();
  }

  setActive(index: number): void {
    const count = this.formes().length;
    if (count < 2) return;
    this.formeIndex.set(((index % count) + count) % count);
  }

  protected onSlotClick(slot: FormeSlot): void {
    if (!this.interactive()) return;
    if (slot.isActive) {
      this.step(1);
    } else {
      this.setActive(slot.index);
      this.cycled.emit();
    }
  }

  protected onContextMenu(event: Event): void {
    if (!this.interactive() || this.stateCount() < 2) return;
    event.preventDefault();
    this.step(-1);
  }

  protected onSlotLoaded(slot: FormeSlot): void {
    if (slot.isActive) this.loadedEvent.emit();
  }
}
