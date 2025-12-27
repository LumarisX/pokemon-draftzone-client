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
  inject,
} from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DraftOptions, Pokemon } from '../../interfaces/pokemon';
import { SpriteService } from '../../services/sprite.service';

type SpritePokemon = Pokemon<DraftOptions>;

@Component({
  selector: 'pdz-sprite',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatProgressSpinnerModule],
  styleUrl: './sprite.component.scss',
  templateUrl: './sprite.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpriteComponent implements OnChanges, OnDestroy {
  private spriteService = inject(SpriteService);
  private cdr = inject(ChangeDetectorRef);

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
  @Input() flipped: string | boolean | null = null;
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
      const shouldFlip =
        (this.flipped === null && this._baseFlip) ||
        (this.flipped !== null && !this._baseFlip);

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
