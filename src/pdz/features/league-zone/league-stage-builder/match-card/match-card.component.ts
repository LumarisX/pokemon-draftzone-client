import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '../../league-bracket/bracket.model';
import { resolveSlot } from '../../league-bracket/league-bracket-canvas/bracket-layout';
import { getLogoUrl } from '../../league.util';

/** One resolved side of a match, ready to render. */
export interface CardSlot {
  team: BracketTeamFlex | null;
  placeholder: string | null;
  status: 'winner' | 'loser' | 'undecided';
  /** Games won. Only shown once the match has a winner. */
  score: number | null;
}

@Component({
  selector: 'pdz-match-card',
  imports: [CommonModule, IconComponent, RouterModule],
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
  /**
   * Route prefix for the matchup page, as
   * `['/leagues', leagueSlug, 'tournaments', tournamentSlug]`. Passed in rather
   * than read off the league service so the card stays usable anywhere the
   * builder is — including the organizer's editor, where it is deliberately
   * left unset so a click never navigates mid-edit.
   */
  @Input() matchupLinkBase?: string[] | null;
  /** Owning stage's id, the `:stageId` segment of the matchup route. */
  @Input() stageId?: string | null;

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  protected readonly getLogoUrl = getLogoUrl;

  get label(): string {
    return this.match.label ?? this.labels.get(this.match.id) ?? 'Match';
  }

  get decided(): boolean {
    return this.match.winner !== undefined;
  }

  get slots(): [CardSlot, CardSlot] {
    return [this.slotAt(0), this.slotAt(1)];
  }

  /**
   * Where this match's page lives, or null when there is nowhere useful to go.
   *
   * A match whose sides are still "winner of …" has no rosters to compare, so
   * it links nowhere until the bracket feeds it two real teams.
   */
  get matchupLink(): string[] | null {
    if (!this.matchupLinkBase?.length || !this.stageId) return null;
    const [side1, side2] = this.slots;
    if (!side1.team || !side2.team) return null;
    return [
      ...this.matchupLinkBase,
      'stages',
      this.stageId,
      'schedule',
      'matchups',
      this.match.id,
    ];
  }

  /** A resolved team's own page, or null when the slot must not navigate. */
  teamLink(slot: CardSlot): string[] | null {
    if (!this.matchupLinkBase?.length || !slot.team?.teamId) return null;
    return [...this.matchupLinkBase, 'teams', slot.team.teamId];
  }

  /** Replay links in game order, empty when nothing has been recorded. */
  get replays(): string[] {
    if (this.match.replays?.length) return this.match.replays;
    return this.match.replay ? [this.match.replay] : [];
  }

  /** True when the footer has anything to put in it. */
  get hasActions(): boolean {
    return !this.editable && (!!this.matchupLink || this.replays.length > 0);
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
      score: this.decided ? (this.match.score?.[index] ?? null) : null,
    };
  }
}
