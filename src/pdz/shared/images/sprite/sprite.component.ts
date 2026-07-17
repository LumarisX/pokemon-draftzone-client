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
  disabled = input(false, { transform: booleanAttribute });
  showFormes = input(false, { transform: booleanAttribute });
  interactive = input(false, { transform: booleanAttribute });
  formeId = model<string | undefined>(undefined);
  formeIndex = model(0);
  loadedEvent = output<void>();

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

  next(): void {
    this.setActive(this.normalizedIndex() + 1);
  }

  previous(): void {
    this.setActive(this.normalizedIndex() - 1);
  }

  setActive(index: number): void {
    const count = this.formes().length;
    if (count < 2) return;
    this.formeIndex.set(((index % count) + count) % count);
  }

  protected onSlotClick(slot: FormeSlot): void {
    if (!this.interactive() || this.formes().length < 2) return;
    if (slot.isActive) {
      this.next();
    } else {
      this.setActive(slot.index);
    }
  }

  protected onSlotLoaded(slot: FormeSlot): void {
    if (slot.isActive) this.loadedEvent.emit();
  }
}
