import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getNameByPid, getPidByName } from '../../data/namedex';
import { DraftOptions, Pokemon } from '../../interfaces/pokemon';
import { SpriteService } from '../../services/sprite.service';

type SpritePokemon = Pokemon<DraftOptions & { loaded?: boolean }>;

@Component({
  selector: 'pdz-sprite',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatProgressSpinnerModule],
  styleUrl: './sprite.component.scss',
  templateUrl: './sprite.component.html',
})
export class SpriteComponent implements OnChanges {
  private spriteService = inject(SpriteService);


  @Input()
  set pokemon(value: SpritePokemon) {
    this._pokemon = { ...value, loaded: false };
  }
  get pokemon(): SpritePokemon {
    return this._pokemon;
  }

  @Input() tooltipPosition:
    | 'before'
    | 'after'
    | 'above'
    | 'below'
    | 'left'
    | 'right'
    | null = 'above';
  @Input() set name(value: string) {
    let id = getPidByName(value);
    if (!id) return;
    this._pokemon = { id, name: value };
  }
  get name() {
    return this._pokemon.name;
  }
  @Input() size?: string;
  @Input() set pid(value: string) {
    let name = getNameByPid(value);
    this._pokemon = { id: value, name };
  }
  get pid() {
    return this._pokemon.id;
  }
  @Input() flipped: string | boolean | null = null;
  @Input() disabled? = false;

  @Output() loaded = new EventEmitter<void>();

  _pokemon!: SpritePokemon;
  readonly UNKNOWN_SPRITE_PATH = this.spriteService.UNKNOWN_SPRITE_PATH;
  path = this.UNKNOWN_SPRITE_PATH;

  private _baseClasses: string[] = [];
  private _baseFlip = false;
  private _fallbackPath: string | undefined;

  get classes(): string[] {
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
    const pokemonChanged =
      changes['pokemon']?.currentValue ||
      changes['name']?.currentValue ||
      changes['pid']?.currentValue;

    if (pokemonChanged && this._pokemon) {
      this.updateData(this._pokemon);
    }
  }

  updateData(pokemon: SpritePokemon) {
    const spriteData = this.spriteService.getSpriteData(pokemon);
    this.path = spriteData.path;
    this._fallbackPath = spriteData.fallbackPath;
    this._baseClasses = spriteData.classes;
    this._baseFlip = spriteData.flip;
  }

  fallback(): void {
    this.pokemon.loaded = true;
    if (this.path !== this.UNKNOWN_SPRITE_PATH) {
      if (this._fallbackPath) {
        this.path = this._fallbackPath;
        this._fallbackPath = undefined;
      } else {
        this.path = this.UNKNOWN_SPRITE_PATH;
      }
    } else {
      console.warn(
        `Sprite for ${this.pokemon?.name || 'unknown'} already failed, showing fallback.`,
      );
    }
  }

  onSpriteLoaded() {
    this.pokemon.loaded = true;
    this.loaded.emit();
  }
}
