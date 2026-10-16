import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeamSlot } from '@pdz/core/utils/versus';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  MatchupComponent,
  MatchupTeam,
} from '@pdz/shared/data/matchup/matchup.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { formatExactTime, formatMatchTime } from '@pdz/shared/time/timezone';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { MatchupCard, MatchupCardSlot } from './matchup-card.model';

type CardStatus = {
  kind: 'forfeit' | 'done' | 'scheduled' | 'unscheduled';
  icon: string;
  label: string;
  tooltip: string | null;
};

function toTeam(slot: MatchupCardSlot): MatchupTeam {
  return {
    name: slot.name,
    logo: getTeamLogoSrc(slot.logo),
    coach: slot.coach,
    link: slot.link,
    pending: slot.pending,
    selectable: !!slot.sourceId,
    score: slot.score,
    result:
      slot.status === 'winner'
        ? 'win'
        : slot.status === 'loser'
          ? 'loss'
          : null,
  };
}

@Component({
  selector: 'pdz-matchup-card',
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    MatchupComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matchup-card.component.html',
  styleUrl: './matchup-card.component.scss',
})
export class MatchupCardComponent {
  readonly card = input.required<MatchupCard>();
  readonly editable = input(false);

  readonly edit = output<string>();
  readonly remove = output<string>();
  readonly focusSource = output<string>();

  protected readonly team1 = computed(() => toTeam(this.card().slots[0]));
  protected readonly team2 = computed(() => toTeam(this.card().slots[1]));

  protected readonly status = computed<CardStatus | null>(() => {
    const card = this.card();
    if (card.forfeit) {
      return { kind: 'forfeit', icon: 'flag', label: 'Forfeit', tooltip: null };
    }
    if (card.advanced) {
      return {
        kind: 'done',
        icon: 'skip_next',
        label: 'Advanced',
        tooltip: null,
      };
    }
    const played = card.slots.some((slot) => slot.score !== null);
    if (card.decided || played) {
      return {
        kind: 'done',
        icon: 'check_circle',
        label: 'Completed',
        tooltip: null,
      };
    }
    if (card.when) {
      return {
        kind: 'scheduled',
        icon: 'schedule',
        label: formatMatchTime(card.when.date, card.when.exact),
        tooltip: card.when.exact ? formatExactTime(card.when.date) : null,
      };
    }
    if (card.slots.some((slot) => slot.pending)) return null;
    return {
      kind: 'unscheduled',
      icon: 'event_busy',
      label: 'Not Scheduled',
      tooltip: null,
    };
  });

  protected readonly hasFooter = computed(() => {
    const card = this.card();
    return !!card.viewLink || !!card.breakdownLink || card.replays.length > 0;
  });

  protected selectSide(slot: TeamSlot): void {
    const sourceId = this.card().slots[slot === 'team1' ? 0 : 1].sourceId;
    if (sourceId) this.focusSource.emit(sourceId);
  }
}
