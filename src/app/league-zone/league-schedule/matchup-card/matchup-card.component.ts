import {
  Component,
  Input,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import {
  ComparisonCardComponent,
  ComparisonEntity,
} from '../../comparison-card/comparison-card.component';
import { League } from '../../league.interface';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { getLogoUrlOld } from '../../league.util';

@Component({
  selector: 'pdz-matchup-card',
  imports: [
    CommonModule,
    ComparisonCardComponent,
    MatIconModule,
    SpriteComponent,
  ],
  templateUrl: './matchup-card.component.html',
  styleUrls: ['./matchup-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupCardComponent {
  @Input({ required: true }) matchup!: League.Matchup;
  @Input() cardOpen: boolean = false;
  selectedMatch = 0;
  leftEntity = computed<ComparisonEntity>(() => ({
    logoUrl: this.getLogoUrl(this.matchup.team1.logo),
    primaryName: this.matchup.team1.teamName,
    secondaryName: this.matchup.team1.coach,
  }));

  rightEntity = computed<ComparisonEntity>(() => ({
    logoUrl: this.getLogoUrl(this.matchup.team2.logo),
    primaryName: this.matchup.team2.teamName,
    secondaryName: this.matchup.team2.coach,
  }));

  leftLogoClasses = computed(() => ({
    positive:
      this.cardOpen && this.matchup.matches[this.selectedMatch].team1.winner,
    negative:
      this.cardOpen && this.matchup.matches[this.selectedMatch].team2.winner,
  }));

  rightLogoClasses = computed(() => ({
    positive:
      this.cardOpen && this.matchup.matches[this.selectedMatch].team2.winner,
    negative:
      this.cardOpen && this.matchup.matches[this.selectedMatch].team1.winner,
  }));

  onReplayClick(event: Event) {
    event.stopPropagation();
    const replayLink = this.matchup.matches[this.selectedMatch].link;
    if (replayLink) {
      window.open(replayLink, '_blank');
    }
  }

  selectGame(index: number, event: Event) {
    event.stopPropagation();
    this.selectedMatch = index;
  }

  getLogoUrl = getLogoUrlOld('user-uploads');
}
