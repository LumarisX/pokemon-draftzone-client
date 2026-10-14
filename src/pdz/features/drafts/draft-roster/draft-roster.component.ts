import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { SeasonMvpComponent } from '@pdz/shared/data/season-mvp/season-mvp.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { RosterSpritesComponent } from '@pdz/shared/images/roster-sprites/roster-sprites.component';
import { DraftSeason, killRatio } from '../draft-season';

@Component({
  selector: 'pdz-draft-roster',
  imports: [
    CardComponent,
    EmptyStateComponent,
    PokemonComponent,
    RosterSpritesComponent,
    SeasonMvpComponent,
  ],
  templateUrl: './draft-roster.component.html',
  styleUrl: './draft-roster.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftRosterComponent {
  readonly season = input.required<DraftSeason>();

  protected readonly killRatio = killRatio;

  protected mvpLine(season: DraftSeason): string {
    const mvp = season.mvp;
    return mvp ? `${mvp.kills} direct · ${mvp.indirect} indirect` : '';
  }
}
