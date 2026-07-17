import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  booleanAttribute,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { distinctUntilChanged, map } from 'rxjs';
import { SpriteService } from '../../../core/services/sprite.service';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { SettingsService } from '@pdz/layout/top-navbar/settings.service';

type SpritePokemon = Pokemon<DraftOptions>;

@Component({
  selector: 'pdz-sprite-image',
  imports: [CommonModule, MatTooltipModule, MatProgressSpinnerModule],
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
        if (this.pokemon?.id) {
          this.updateData(this.pokemon);
          this.cdr.markForCheck();
        }
      });
  }

  @Input({ required: true }) pokemon!: SpritePokemon;
  @Input() tooltipPosition:
    | 'before'
    | 'after'
    | 'above'
    | 'below'
    | 'left'
    | 'right'
    | null = null;
  @Input() size?: string;
  @Input({ transform: booleanAttribute }) flipped = false;
  @Input() disabled?: boolean = false;

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
    return this.pokemon?.name ?? 'Unknown';
  }

  protected get classes(): string[] {
    const classes = [...this._baseClasses];
    const isUnknownSprite = this.path === this.UNKNOWN_SPRITE_PATH;
    if (!isUnknownSprite) {
      const shouldFlip = this.flipped !== this._baseFlip;

      if (shouldFlip) {
        classes.push('flip');
      }
    }
    if (this.disabled) {
      classes.push('disabled');
    }
    return classes;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokemon'] && this.pokemon?.id) {
      this.updateData(this.pokemon);
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
