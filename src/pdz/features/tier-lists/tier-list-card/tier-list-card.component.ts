import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TierListSummary } from '../tier-list.service';

const VISIBILITY_LABEL = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
} as const;

const VISIBILITY_ICON = {
  private: 'lock',
  unlisted: 'link',
  public: 'public',
} as const;

@Component({
  selector: 'pdz-tier-list-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CardComponent, ChipComponent, IconComponent, SpriteComponent],
  template: `
    <pdz-card padding="lg" class="list-card">
      <div class="list-card__inner">
        <div class="list-card__top">
          <h3 class="list-card__title">
            <a class="list-card__name" [routerLink]="link()">{{ list().name }}</a>
          </h3>
          @if (list().featured) {
            <pdz-chip size="xs" tone="secondary" icon="star">Featured</pdz-chip>
          }
        </div>

        <p class="list-card__meta">
          @if (list().authorName) {
            <span>by {{ list().authorName }}</span>
            <span aria-hidden="true">·</span>
          }
          <span>{{ list().format }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ list().ruleset }}</span>
        </p>

        @if (list().topPokemon.length) {
          <div class="list-card__sprites" aria-hidden="true">
            @for (pokemon of list().topPokemon; track pokemon.id) {
              <pdz-sprite size="sm" [pokemon]="pokemon" />
            }
          </div>
        }

        @if (list().description) {
          <p class="list-card__desc">{{ list().description }}</p>
        }

        <p class="list-card__stats">
          <span><strong>{{ list().pokemonCount }}</strong> Pokémon</span>
          <span aria-hidden="true">·</span>
          <span><strong>{{ list().tierCount }}</strong> tiers</span>
          @if (list().forkCount) {
            <span aria-hidden="true">·</span>
            <span><strong>{{ list().forkCount }}</strong> {{ list().forkCount === 1 ? 'fork' : 'forks' }}</span>
          }
          @if (list().useCount) {
            <span aria-hidden="true">·</span>
            <span>used <strong>{{ list().useCount }}</strong>×</span>
          }
        </p>

        <div class="list-card__chips">
          @if (showVisibility()) {
            <pdz-chip size="xs" [icon]="visibilityIcon()">{{ visibilityLabel() }}</pdz-chip>
          }
          @if (roleLabel(); as role) {
            <pdz-chip size="xs" tone="primary">{{ role }}</pdz-chip>
          }
          @for (tag of list().tags; track tag) {
            <pdz-chip size="xs" variant="outline">{{ tag }}</pdz-chip>
          }
        </div>

        @if (list().copiedFrom; as source) {
          <p class="list-card__lineage">
            <pdz-icon name="call_split" [size]="14" aria-hidden="true" />
            Forked from
            <a [routerLink]="['/', path, source.slug]">{{ source.name }}</a>
          </p>
        }

        <div class="list-card__actions">
          <ng-content />
        </div>
      </div>
    </pdz-card>
  `,
  styleUrl: './tier-list-card.component.scss',
})
export class TierListCardComponent {
  readonly list = input.required<TierListSummary>();
  readonly showVisibility = input(false, { transform: booleanAttribute });

  protected readonly path = TIER_LIST_PATH;
  protected readonly link = computed(() => ['/', TIER_LIST_PATH, this.list().slug]);
  protected readonly visibilityLabel = computed(
    () => VISIBILITY_LABEL[this.list().visibility],
  );
  protected readonly visibilityIcon = computed(
    () => VISIBILITY_ICON[this.list().visibility],
  );
  protected readonly roleLabel = computed(() => {
    const role = this.list().role;
    if (role === 'editor') return 'Editor';
    if (role === 'viewer') return 'Viewer';
    return null;
  });
}
