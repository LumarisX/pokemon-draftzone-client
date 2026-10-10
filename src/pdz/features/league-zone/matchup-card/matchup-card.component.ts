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
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import {
  MatchupComponent,
  MatchupTeam,
} from '@pdz/shared/data/matchup/matchup.component';
import { MatchupCard, MatchupCardSlot } from './matchup-card.model';

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
  imports: [RouterLink, ButtonComponent, ChipComponent, MatchupComponent],
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

  protected readonly hasFooter = computed(() => {
    const card = this.card();
    return !!card.viewLink || !!card.breakdownLink || card.replays.length > 0;
  });

  protected selectSide(slot: TeamSlot): void {
    const sourceId = this.card().slots[slot === 'team1' ? 0 : 1].sourceId;
    if (sourceId) this.focusSource.emit(sourceId);
  }
}
