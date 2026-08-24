import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { SpriteData, SpriteService } from '../../../core/services/sprite.service';

type SpritePokemon = Pokemon<DraftOptions>;

@Component({
  selector: 'pdz-sprite-image',
  imports: [NgClass, TooltipDirective],
  styleUrl: './sprite-image.component.scss',
  templateUrl: './sprite-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpriteImageComponent {
  private spriteService = inject(SpriteService);

  readonly pokemon = input.required<SpritePokemon>();
  readonly tooltipPosition = input<
    'before' | 'after' | 'above' | 'below' | 'left' | 'right' | null
  >(null);
  readonly size = input<string>();
  readonly flipped = input(false, { transform: booleanAttribute });
  readonly disabled = input<boolean | undefined>(false);

  readonly loadedEvent = output<void>();

  protected readonly UNKNOWN_SPRITE_PATH =
    this.spriteService.UNKNOWN_SPRITE_PATH;

  private readonly spriteData = computed<SpriteData>(
    () =>
      this.spriteService.getSpriteData(this.pokemon()) ?? {
        path: this.UNKNOWN_SPRITE_PATH,
        fallbackPaths: [],
        classes: [],
        flip: false,
      },
  );

  private readonly candidates = computed(() => [
    this.spriteData().path,
    ...this.spriteData().fallbackPaths,
    this.UNKNOWN_SPRITE_PATH,
  ]);

  private readonly candidateIndex = linkedSignal({
    source: this.candidates,
    computation: () => 0,
  });

  readonly resolvedStep = this.candidateIndex.asReadonly();
  readonly lastStep = computed(() => this.candidates().length - 1);

  protected readonly path = computed(
    () => this.candidates()[this.candidateIndex()] ?? this.UNKNOWN_SPRITE_PATH,
  );

  protected readonly pokemonName = computed(
    () => this.pokemon().name ?? 'Unknown',
  );

  protected readonly classes = computed(() => {
    const { classes, flip } = this.spriteData();
    const resolved = [...classes];
    if (this.path() !== this.UNKNOWN_SPRITE_PATH && this.flipped() !== flip) {
      resolved.push('flip');
    }
    if (this.disabled()) resolved.push('disabled');
    return resolved;
  });

  protected fallback(): void {
    this.candidateIndex.update((index) =>
      Math.min(index + 1, this.candidates().length - 1),
    );
  }
}
