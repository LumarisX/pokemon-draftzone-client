import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { getLogoUrl } from '@pdz/features/league-zone/league.util';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { formatExactTime } from '@pdz/shared/time/timezone';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { SeasonMatch } from '../drafts-v2.model';

let nextRowId = 0;

@Component({
  selector: 'pdz-match-row',
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    SpriteComponent,
    CountdownComponent,
    TooltipDirective,
  ],
  templateUrl: './match-row.component.html',
  styleUrl: './match-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-match',
    '[class.dz-match--next]': 'next()',
    '[class.dz-match--open]': 'open()',
  },
})
export class MatchRowComponent {
  readonly match = input.required<SeasonMatch>();
  readonly next = input(false, { transform: booleanAttribute });

  readonly scheduleRequested = output<SeasonMatch>();
  readonly deleteRequested = output<SeasonMatch>();

  protected readonly open = signal(false);
  protected readonly panelId = `dz-match-panel-${nextRowId++}`;

  protected readonly result = computed(() => {
    const score = this.match().score;
    if (!score) return 'pending';
    if (score[0] > score[1]) return 'win';
    if (score[0] < score[1]) return 'loss';
    return 'tie';
  });

  protected readonly logoUrl = computed(() => {
    const logo = this.match().logo;
    return logo ? getLogoUrl(logo) : null;
  });

  protected readonly crest = computed(() =>
    this.match()
      .teamName.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join(''),
  );

  protected readonly exactTime = computed(() => {
    const scheduled = this.match().scheduledDate;
    if (!scheduled) return null;
    const date = new Date(scheduled);
    return Number.isNaN(date.getTime()) ? null : formatExactTime(date);
  });

  protected toggle() {
    this.open.update((value) => !value);
  }
}
