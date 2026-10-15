import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Pokemon } from '@pdz/core/utils/pokemon';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  SpriteComponent,
  SpriteSize,
} from '@pdz/shared/images/sprite/sprite.component';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateKind = 'empty' | 'waiting' | 'error' | 'no-access';
export type EmptyStateRetry = 'event' | 'reload';

const ICON_SIZES: Record<EmptyStateSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
};

const ACTOR_SIZES: Record<EmptyStateSize, SpriteSize | null> = {
  sm: null,
  md: 'lg',
  lg: 'xl',
};

const ACTORS: Record<EmptyStateKind, { pokemon: Pokemon; icon: string }> = {
  empty: { pokemon: { id: 'ditto', name: 'Ditto' }, icon: 'inbox' },
  waiting: { pokemon: { id: 'slowpoke', name: 'Slowpoke' }, icon: 'schedule' },
  error: { pokemon: { id: 'psyduck', name: 'Psyduck' }, icon: 'error' },
  'no-access': { pokemon: { id: 'snorlax', name: 'Snorlax' }, icon: 'lock' },
};

@Component({
  selector: 'pdz-empty-state',
  imports: [ButtonComponent, IconComponent, SpriteComponent],
  template: `
    @if (actor(); as actor) {
      <pdz-sprite
        class="pdz-empty-state__actor"
        aria-hidden="true"
        [pokemon]="actor.pokemon"
        [size]="actor.size"
        [showFormes]="false"
        [tooltipPosition]="null"
      />
    } @else if (shownIcon(); as name) {
      <pdz-icon
        class="pdz-empty-state__icon"
        aria-hidden="true"
        [name]="name"
        [size]="iconSize()"
      />
    }
    @if (heading()) {
      <p class="pdz-empty-state__heading">{{ heading() }}</p>
    }
    @if (message()) {
      <p class="pdz-empty-state__message">{{ message() }}</p>
    }
    <ng-content />
    <div class="pdz-empty-state__actions">
      @if (retry()) {
        <button
          pdz-button
          icon="refresh"
          variant="outlined"
          color="neutral"
          [size]="size() === 'sm' ? 'sm' : 'md'"
          (click)="tryAgain()"
        >
          {{ retryLabel() }}
        </button>
      }
      <ng-content select="[pdz-empty-state-actions]" />
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-empty-state',
    '[attr.data-size]': 'size()',
    '[attr.data-kind]': 'kind()',
    '[class.pdz-empty-state--bordered]': 'bordered()',
  },
})
export class EmptyStateComponent {
  icon = input<string>();
  kind = input<EmptyStateKind>();
  heading = input<string>();
  message = input<string>();
  size = input<EmptyStateSize>('md');
  bordered = input(false, { transform: booleanAttribute });
  retry = input<EmptyStateRetry>();
  retryLabel = input('Try Again');
  retried = output<void>();

  private readonly document = inject(DOCUMENT);

  protected tryAgain(): void {
    if (this.retry() === 'reload') {
      this.document.defaultView?.location.reload();
      return;
    }
    this.retried.emit();
  }

  protected iconSize = computed(() => ICON_SIZES[this.size()]);

  protected actor = computed(() => {
    const kind = this.kind();
    const size = ACTOR_SIZES[this.size()];
    return kind && size ? { pokemon: ACTORS[kind].pokemon, size } : null;
  });

  protected shownIcon = computed(() => {
    const kind = this.kind();
    return this.icon() ?? (kind ? ACTORS[kind].icon : undefined);
  });
}
