import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { distinctUntilChanged, map } from 'rxjs';
import { SpriteService } from '../../../core/services/sprite.service';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';

type SpritePokemon = Pokemon<DraftOptions>;

@Component({
  selector: 'pdz-sprite-image',
  imports: [CommonModule, TooltipDirective],
  styleUrl: './sprite-image.component.scss',
  templateUrl: './sprite-image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpriteImageComponent implements OnChanges, OnDestroy {
  private spriteService = inject(SpriteService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.settingsService.settings$
      .pipe(
        map((settings) => settings.spriteSet),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const pokemon = this.pokemon();
        if (pokemon?.id) {
          this.updateData(pokemon);
          this.cdr.markForCheck();
        }
      });
  }

  readonly pokemon = input.required<SpritePokemon>();
  readonly tooltipPosition = input<
    'before' | 'after' | 'above' | 'below' | 'left' | 'right' | null
  >(null);
  readonly size = input<string>();
  readonly flipped = input(false, { transform: booleanAttribute });
  readonly disabled = input<boolean | undefined>(false);

  @Output() loadedEvent = new EventEmitter<void>();

  protected loaded = false;
  protected readonly UNKNOWN_SPRITE_PATH =
    this.spriteService.UNKNOWN_SPRITE_PATH;
  protected path = this.UNKNOWN_SPRITE_PATH;
  private _baseClasses: string[] = [];
  private _baseFlip = false;
  private _fallbackPath: string | undefined;
  private _destroyed = false;

  protected get pokemonName(): string {
    return this.pokemon()?.name ?? 'Unknown';
  }

  protected get classes(): string[] {
    const classes = [...this._baseClasses];
    const isUnknownSprite = this.path === this.UNKNOWN_SPRITE_PATH;
    if (!isUnknownSprite) {
      const shouldFlip = this.flipped() !== this._baseFlip;

      if (shouldFlip) {
        classes.push('flip');
      }
    }
    if (this.disabled()) {
      classes.push('disabled');
    }
    return classes;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const pokemon = this.pokemon();
    if (changes['pokemon'] && pokemon?.id) {
      this.updateData(pokemon);
    }
  }

  ngOnDestroy(): void {
    this._destroyed = true;
  }

  updateData(pokemon: SpritePokemon) {
    const spriteData = this.spriteService.getSpriteData(pokemon) ?? {
      path: this.UNKNOWN_SPRITE_PATH,
      classes: [],
      flip: false,
    };
    this.path = spriteData.path;
    this._fallbackPath = spriteData.fallbackPath;
    this._baseClasses = spriteData.classes;
    this._baseFlip = spriteData.flip;
    this.loaded = false;
  }

  protected fallback(): void {
    if (this._destroyed) return;

    if (this.path !== this.UNKNOWN_SPRITE_PATH) {
      if (this._fallbackPath) {
        this.path = this._fallbackPath;
        this._fallbackPath = undefined;
      } else {
        this.path = this.UNKNOWN_SPRITE_PATH;
      }
    }
    this.loaded = true;
    this.cdr.markForCheck();
  }

  protected onSpriteLoaded(): void {
    if (this._destroyed) return;

    this.loaded = true;
    this.loadedEvent.emit();
    this.cdr.markForCheck();
  }
}
