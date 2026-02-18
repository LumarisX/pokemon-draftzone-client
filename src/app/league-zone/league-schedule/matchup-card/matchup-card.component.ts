import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { League } from '../../league.interface';
import { getLogoUrl } from '../../league.util';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'pdz-matchup-card',
  imports: [CommonModule, MatIconModule, SpriteComponent, RouterModule],
  templateUrl: './matchup-card.component.html',
  styleUrls: ['./matchup-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchupCardComponent implements OnInit {
  @Input({ required: true }) matchup!: League.Matchup;
  @Input() initiallyOpen: boolean = false;

  private _isOpen = signal<boolean>(false);
  isOpen = this._isOpen.asReadonly();
  selectedMatch = 0;

  ngOnInit(): void {
    if (this.initiallyOpen && this.matchup.matches.length > 0) {
      this._isOpen.set(true);
    }
  }

  toggleOpen(): void {
    if (this.matchup.matches.length > 0) {
      this._isOpen.update((open) => !open);
    }
  }

  onReplayClick(event: Event): void {
    event.stopPropagation();
    const match = this.matchup.matches[this.selectedMatch];
    if (match?.link) {
      window.open(match.link, '_blank');
    }
  }

  selectMatch(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedMatch = index;
  }

  getLogo(logoUrl?: string): string {
    return getLogoUrl(logoUrl);
  }
}
