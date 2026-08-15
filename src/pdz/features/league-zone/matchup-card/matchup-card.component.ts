import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
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
  @Input({ required: true }) card!: MatchupCard;
  @Input() editable = false;

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() focusSource = new EventEmitter<string>();

  protected readonly getLogoUrl = getLogoUrl;

  protected get hasHeader(): boolean {
    return !!this.card.label || this.editable || this.card.forfeit;
  }

  protected get hasFooter(): boolean {
    return (
      !!this.card.viewLink ||
      !!this.card.breakdownLink ||
      this.card.replays.length > 0
    );
  }
}
