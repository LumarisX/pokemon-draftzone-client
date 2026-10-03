import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { MatchupCard } from './matchup-card.model';

@Component({
  selector: 'pdz-matchup-card',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    IconComponent,
    ButtonComponent,
    TeamLogoComponent,
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

  protected readonly logoSrc = getTeamLogoSrc;

  protected readonly hasHeader = computed(() => {
    const card = this.card();
    return !!card.label || this.editable() || card.forfeit;
  });

  protected readonly hasFooter = computed(() => {
    const card = this.card();
    return !!card.viewLink || !!card.breakdownLink || card.replays.length > 0;
  });
}
