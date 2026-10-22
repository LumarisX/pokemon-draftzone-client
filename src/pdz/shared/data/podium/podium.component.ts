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
  wins?: number | null;
  losses?: number | null;
  draws?: number | null;
  pokemon?: readonly Pokemon<DraftOptions>[] | null;
  link?: readonly string[] | null;
};

export const PODIUM_SIZE = 3;
export const PODIUM_LEADERS = 3;

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
                <pdz-team-logo
                  class="pdz-podium__logo"
                  size="2xl"
                  decorative
                  [src]="place.logo"
                  [name]="place.name"
                />
              </div>
              <div class="pdz-podium__step">
                <span class="pdz-podium__rank" aria-hidden="true">{{
                  $index + 1
                }}</span>
                @if (place.link; as link) {
                  <a class="pdz-podium__name" [routerLink]="link">{{
                    place.name
                  }}</a>
                } @else {
                  <span class="pdz-podium__name">{{ place.name }}</span>
                }
                @if (place.coach) {
                  <span class="pdz-podium__coach">{{ place.coach }}</span>
                }
                @if (recordOf(place); as record) {
                  <pdz-record
                    size="sm"
                    [wins]="record.wins"
                    [losses]="record.losses"
                    [draws]="record.draws"
                  />
                }
                @if (leadersOf(place); as leaders) {
                  <ul class="pdz-podium__leaders" aria-label="Top scorers">
                    @for (pokemon of leaders; track $index) {
                      <li class="pdz-podium__leader">
                        <pdz-sprite
                          size="sm"
                          [pokemon]="pokemon"
                          [showFormes]="false"
                        />
                      </li>
                    }
                  </ul>
                }
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

  protected recordOf(
    place: PodiumPlace,
  ): { wins: number; losses: number; draws: number | null } | null {
    if (place.wins == null || place.losses == null) return null;
    return { wins: place.wins, losses: place.losses, draws: place.draws ?? null };
  }

  protected leadersOf(
    place: PodiumPlace,
  ): readonly Pokemon<DraftOptions>[] | null {
    return place.pokemon?.length
      ? place.pokemon.slice(0, PODIUM_LEADERS)
      : null;
  }
}
