import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { getLogoUrl } from '../league.util';
import { MatchupCard } from './matchup-card.model';

@Component({
  selector: 'pdz-matchup-card',
  imports: [NgTemplateOutlet, RouterModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matchup-card.component.html',
  styleUrl: './matchup-card.component.scss',
})
export class MatchupCardComponent {
  readonly card = input.required<MatchupCard>();
  readonly editable = input(false);

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() focusSource = new EventEmitter<string>();

  protected readonly getLogoUrl = getLogoUrl;

  protected get hasHeader(): boolean {
    const card = this.card();
    return !!card.label || this.editable() || card.forfeit;
  }

  protected get hasFooter(): boolean {
    const card = this.card();
    return !!card.viewLink || !!card.breakdownLink || card.replays.length > 0;
  }
}
