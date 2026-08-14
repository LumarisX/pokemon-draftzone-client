import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '../../league-bracket/bracket.model';
import { resolveSlot } from '../../league-bracket/league-bracket-canvas/bracket-layout';
import { MatchupCardComponent } from '../../matchup-card/matchup-card.component';
import {
  MatchupCard,
  MatchupCardSlot,
} from '../../matchup-card/matchup-card.model';

@Component({
  selector: 'pdz-match-card',
  imports: [MatchupCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdz-matchup-card
      [card]="card"
      [editable]="editable"
      (edit)="edit.emit($event)"
      (remove)="remove.emit($event)"
      (focusSource)="focusMatch.emit($event)"
    ></pdz-matchup-card>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MatchCardComponent {
  @Input({ required: true }) match!: FlexBracketMatch;
  @Input({ required: true }) allMatches: FlexBracketMatch[] = [];
  @Input() teams: BracketTeamFlex[] = [];
  @Input() labels = new Map<string, string>();
  @Input() editable = false;
  @Input() matchupLinkBase?: string[] | null;

  @Output() edit = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() focusMatch = new EventEmitter<string>();

  get card(): MatchupCard {
    const slots: [MatchupCardSlot, MatchupCardSlot] = [
      this.slotAt(0),
      this.slotAt(1),
    ];
    const viewLink = this.viewLink(slots);

    return {
      id: this.match.id,
      label: this.label,
      decided: this.decided,
      forfeit: !!this.match.forfeit,
      slots,
      viewLink,
      breakdownLink:
        viewLink && !this.decided ? [...viewLink, 'breakdown'] : null,
      replays: this.editable ? [] : this.replays,
    };
  }

  private get label(): string {
    return this.match.label ?? this.labels.get(this.match.id) ?? 'Match';
  }

  private get decided(): boolean {
    return this.match.winner !== undefined;
  }

  private get replays(): string[] {
    if (this.match.replays?.length) return this.match.replays;
    return this.match.replay ? [this.match.replay] : [];
  }

  private viewLink(
    slots: [MatchupCardSlot, MatchupCardSlot],
  ): string[] | null {
    if (this.editable) return null;
    if (!this.matchupLinkBase?.length || !this.match.slug) return null;
    if (slots.some((slot) => slot.pending)) return null;
    return [...this.matchupLinkBase, 'matchups', this.match.slug];
  }

  private slotAt(index: 0 | 1): MatchupCardSlot {
    const raw = index === 0 ? this.match.a : this.match.b;
    const { team, placeholder, sourceId } = resolveSlot(
      raw,
      this.teams,
      this.allMatches,
      this.labels,
    );

    return {
      name: team?.teamName ?? placeholder ?? 'TBD',
      coach: team?.coachName ?? null,
      logo: team?.logo,
      pending: !team,
      status:
        this.match.winner === undefined
          ? 'undecided'
          : this.match.winner === index
            ? 'winner'
            : 'loser',
      score: this.decided ? (this.match.score?.[index] ?? null) : null,
      link:
        team?.teamSlug && this.matchupLinkBase?.length
          ? [...this.matchupLinkBase, 'teams', team.teamSlug]
          : null,
      sourceId: team ? null : sourceId,
    };
  }
}
