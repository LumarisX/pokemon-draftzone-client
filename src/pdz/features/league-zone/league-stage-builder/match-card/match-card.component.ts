import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '../../league-bracket/bracket.model';
import { resolveSlot } from '../../league-bracket/league-bracket-canvas/bracket-layout';
import { getLogoUrl } from '../../league.util';

/** One resolved side of a match, ready to render. */
interface CardSlot {
  team: BracketTeamFlex | null;
  placeholder: string | null;
  status: 'winner' | 'loser' | 'undecided';
}

@Component({
  selector: 'pdz-match-card',
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './match-card.component.html',
  styleUrl: './match-card.component.scss',
})
export class MatchCardComponent {
  @Input({ required: true }) match!: FlexBracketMatch;
  /** Every match in the draft — a slot resolves by following winner/loser chains. */
  @Input({ required: true }) allMatches: FlexBracketMatch[] = [];
  @Input() teams: BracketTeamFlex[] = [];
  /** Display labels by match id, so a pending slot can name its source. */
  @Input() labels = new Map<string, string>();
  @Input() editable = false;

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  protected readonly getLogoUrl = getLogoUrl;

  get label(): string {
    return this.match.label ?? this.labels.get(this.match.id) ?? 'Match';
  }

  get slots(): [CardSlot, CardSlot] {
    return [this.slotAt(0), this.slotAt(1)];
  }

  private slotAt(index: 0 | 1): CardSlot {
    const raw = index === 0 ? this.match.a : this.match.b;
    const { team, placeholder } = resolveSlot(
      raw,
      this.teams,
      this.allMatches,
      this.labels,
    );
    return {
      team,
      placeholder,
      status:
        this.match.winner === undefined
          ? 'undecided'
          : this.match.winner === index
            ? 'winner'
            : 'loser',
    };
  }
}
