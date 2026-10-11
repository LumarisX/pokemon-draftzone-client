import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DraftOptions, Pokemon } from '@pdz/core/utils/pokemon';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PokemonTypeComponent } from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

export type SeasonMvpStat = {
  label: string;
  value: string | number;
};

@Component({
  selector: 'pdz-season-mvp',
  imports: [CardComponent, PokemonTypeComponent, SpriteComponent],
  template: `
    <pdz-card padding="md">
      <div class="pdz-season-mvp">
        <pdz-sprite
          class="pdz-season-mvp__sprite"
          size="5.5rem"
          grounded
          flipped
          [pokemon]="pokemon()"
        />
        <div class="pdz-season-mvp__text">
          <span class="pdz-season-mvp__eyebrow">{{ label() }}</span>
          <span class="pdz-season-mvp__name">{{ pokemon().name }}</span>
          @if (types().length || detail()) {
            <span class="pdz-season-mvp__detail">
              @for (type of types(); track type) {
                <pdz-pokemon-type size="xs" [type]="type" />
              }
              @if (detail(); as detail) {
                <span>{{ detail }}</span>
              }
            </span>
          }
        </div>
        @if (stats().length) {
          <dl class="pdz-season-mvp__stats">
            @for (stat of stats(); track stat.label) {
              <div class="pdz-season-mvp__stat">
                <dt>{{ stat.label }}</dt>
                <dd>{{ stat.value }}</dd>
              </div>
            }
          </dl>
        }
        <span class="pdz-season-mvp__count">
          <span class="pdz-season-mvp__number">{{ knockouts() }}</span>
          <span class="pdz-season-mvp__unit">{{
            knockouts() === 1 ? 'KO' : 'KOs'
          }}</span>
        </span>
      </div>
    </pdz-card>
  `,
  styleUrl: './season-mvp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonMvpComponent {
  readonly pokemon = input.required<Pokemon<DraftOptions>>();
  readonly knockouts = input.required<number>();
  readonly detail = input('');
  readonly types = input<readonly string[]>([]);
  readonly stats = input<readonly SeasonMvpStat[]>([]);
  readonly label = input('Season MVP');
}
