import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
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
      [editable]="editable()"
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
  readonly match = input.required<FlexBracketMatch>();
  readonly allMatches = input.required<FlexBracketMatch[]>();
  readonly teams = input<BracketTeamFlex[]>([]);
  readonly labels = input(new Map<string, string>());
  readonly editable = input(false);
  readonly matchupLinkBase = input<string[] | null>();

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
      id: this.match().id,
      label: this.label,
      decided: this.decided,
      forfeit: !!this.match().forfeit,
      slots,
      viewLink,
      breakdownLink:
        viewLink && !this.decided ? [...viewLink, 'breakdown'] : null,
      replays: this.editable() ? [] : this.replays,
    };
  }

  private get label(): string {
    const match = this.match();
    return match.label ?? this.labels().get(match.id) ?? 'Match';
  }

  private get decided(): boolean {
    return this.match().winner !== undefined;
  }

  private get replays(): string[] {
    const match = this.match();
    if (match.replays?.length) return match.replays;
    return match.replay ? [match.replay] : [];
  }

  private viewLink(slots: [MatchupCardSlot, MatchupCardSlot]): string[] | null {
    if (this.editable()) return null;
    const match = this.match();
    const matchupLinkBase = this.matchupLinkBase();
    if (!matchupLinkBase?.length || !match.slug) return null;
    if (slots.some((slot) => slot.pending)) return null;
    return [...matchupLinkBase, 'matchups', match.slug];
  }

  private slotAt(index: 0 | 1): MatchupCardSlot {
    const raw = index === 0 ? this.match().a : this.match().b;
    const { team, placeholder, sourceId } = resolveSlot(
      raw,
      this.teams(),
      this.allMatches(),
      this.labels(),
    );

    const match = this.match();
    const matchupLinkBase = this.matchupLinkBase();
    return {
      name: team?.teamName ?? placeholder ?? 'TBD',
      coach: team?.coachName ?? null,
      logo: team?.logo,
      pending: !team,
      status:
        match.winner === undefined
          ? 'undecided'
          : match.winner === index
            ? 'winner'
            : 'loser',
      score: this.decided ? (this.match().score?.[index] ?? null) : null,
      link:
        team?.teamSlug && matchupLinkBase?.length
          ? [...matchupLinkBase, 'teams', team.teamSlug]
          : null,
      sourceId: team ? null : sourceId,
    };
  }
}
