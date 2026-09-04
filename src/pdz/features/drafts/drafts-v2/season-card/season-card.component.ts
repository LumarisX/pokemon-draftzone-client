import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { Season, seasonPlayed } from '../drafts-v2.model';

@Component({
  selector: 'button[pdz-season-card]',
  imports: [CountdownComponent, IconComponent, SpriteComponent],
  templateUrl: './season-card.component.html',
  styleUrl: './season-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-season-card',
    type: 'button',
    role: 'tab',
    '[attr.aria-selected]': 'selected()',
    '[attr.tabindex]': 'selected() ? 0 : -1',
    '[attr.data-status]': 'season().status',
    '[class.dz-season-card--selected]': 'selected()',
  },
})
export class SeasonCardComponent {
  readonly season = input.required<Season>();
  readonly selected = input(false, { transform: booleanAttribute });

  protected readonly played = computed(() => seasonPlayed(this.season()));

  protected readonly eyebrow = computed(() => {
    const season = this.season();
    if (season.leagueName) return season.leagueName;
    return season.status === 'archived' ? 'Archived draft' : 'Personal draft';
  });

  protected readonly preview = computed(() => this.season().roster.slice(0, 12));

  protected readonly recordTone = computed(() => {
    const { wins, losses } = this.season().record;
    if (!wins && !losses) return 'idle';
    if (wins > losses) return 'positive';
    if (wins < losses) return 'negative';
    return 'even';
  });
}
