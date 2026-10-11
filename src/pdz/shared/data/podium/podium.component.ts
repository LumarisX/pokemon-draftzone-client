import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';

export type PodiumPlace = {
  name: string;
  logo?: string;
  coach?: string;
  wins: number;
  losses: number;
  draws?: number;
  pokemon?: Pokemon<DraftOptions> | null;
  link?: readonly string[] | null;
  you?: boolean;
};

export const PODIUM_SIZE = 3;

@Component({
  selector: 'pdz-podium',
  imports: [CardComponent, RecordComponent, RouterLink, SpriteComponent, TeamLogoComponent],
  template: `
    <pdz-card padding="md">
      <div class="pdz-podium">
        <span class="pdz-podium__eyebrow">{{ label() }}</span>
        <ol class="pdz-podium__stage" [attr.data-count]="places().length">
          @for (place of places().slice(0, size); track $index) {
            <li class="pdz-podium__place" [attr.data-place]="$index + 1">
              <div class="pdz-podium__actor">
                @if (place.pokemon; as pokemon) {
                  <pdz-sprite
                    class="pdz-podium__sprite"
                    size="100%"
                    grounded
                    [pokemon]="pokemon"
                    [flipped]="$index === 1"
                    [showFormes]="false"
                  />
                }
              </div>
              <div class="pdz-podium__step">
                <span class="pdz-podium__rank" aria-hidden="true">{{
                  $index + 1
                }}</span>
                <pdz-team-logo
                  [size]="$index === 0 ? 'lg' : 'md'"
                  decorative
                  [src]="place.logo"
                  [name]="place.name"
                />
                @if (place.link; as link) {
                  <a class="pdz-podium__name" [routerLink]="link">{{
                    place.name
                  }}</a>
                } @else {
                  <span class="pdz-podium__name">{{ place.name }}</span>
                }
                @if (place.you) {
                  <span class="pdz-you-tag">You</span>
                }
                @if (place.coach) {
                  <span class="pdz-podium__coach">{{ place.coach }}</span>
                }
                <pdz-record
                  size="sm"
                  [wins]="place.wins"
                  [losses]="place.losses"
                  [draws]="place.draws"
                />
              </div>
            </li>
          }
        </ol>
      </div>
    </pdz-card>
  `,
  styleUrl: './podium.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodiumComponent {
  protected readonly size = PODIUM_SIZE;

  readonly places = input.required<readonly PodiumPlace[]>();
  readonly label = input('Final Standings');
}
