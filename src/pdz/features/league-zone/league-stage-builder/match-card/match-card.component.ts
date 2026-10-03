import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  BracketTeamFlex,
  FlexBracketMatch,
} from '@pdz/features/league-zone/league-bracket/bracket.model';
import {
  advancingSideIndex,
  resolveSlot,
} from '@pdz/features/league-zone/league-bracket/league-bracket-canvas/bracket-layout';
import { MatchupCardComponent } from '@pdz/features/league-zone/matchup-card/matchup-card.component';
import {
  MatchupCard,
  MatchupCardSlot,
} from '@pdz/features/league-zone/matchup-card/matchup-card.model';

@Component({
  selector: 'pdz-match-card',
  imports: [MatchupCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdz-matchup-card
      [card]="card()"
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

  readonly edit = output<string>();
  readonly remove = output<string>();
  readonly focusMatch = output<string>();

  private readonly advancing = computed(() =>
    advancingSideIndex(this.match(), 'winner', this.allMatches()),
  );
  private readonly decided = computed(() => this.advancing() !== null);
  private readonly played = computed(() => this.match().winner !== undefined);

  readonly card = computed<MatchupCard>(() => {
    const slots: [MatchupCardSlot, MatchupCardSlot] = [
      this.slotAt(0),
      this.slotAt(1),
    ];
    const viewLink = this.viewLink(slots);
    const match = this.match();
    const decided = this.decided();

    return {
      id: match.id,
      label: match.label ?? this.labels().get(match.id) ?? 'Match',
      decided,
      forfeit: !!match.forfeit,
      advanced: decided && !this.played(),
      slots,
      viewLink,
      breakdownLink: viewLink && !decided ? [...viewLink, 'breakdown'] : null,
      replays: this.editable() ? [] : this.replays(match),
    };
  });

  private replays(match: FlexBracketMatch): string[] {
    if (match.replays?.length) return match.replays;
    return match.replay ? [match.replay] : [];
  }

  private viewLink(slots: [MatchupCardSlot, MatchupCardSlot]): string[] | null {
    if (this.editable()) return null;
    const matchupLinkBase = this.matchupLinkBase();
    const match = this.match();
    if (!matchupLinkBase?.length || !match.slug) return null;
    if (slots.some((slot) => slot.pending)) return null;
    return [...matchupLinkBase, 'matchups', match.slug];
  }

  private slotAt(index: 0 | 1): MatchupCardSlot {
    const match = this.match();
    const raw = index === 0 ? match.a : match.b;
    const { team, placeholder, sourceId } = resolveSlot(
      raw,
      this.teams(),
      this.allMatches(),
      this.labels(),
    );

    const matchupLinkBase = this.matchupLinkBase();
    const advancing = this.advancing();
    return {
      name: team?.teamName ?? placeholder ?? 'TBD',
      coach: team?.coachName ?? null,
      logo: team?.logo,
      slug: team?.teamSlug ?? null,
      pending: !team,
      status:
        advancing === null
          ? 'undecided'
          : advancing === index
            ? 'winner'
            : 'loser',
      score: this.played() ? (match.score?.[index] ?? null) : null,
      link:
        team?.teamSlug && matchupLinkBase?.length
          ? [...matchupLinkBase, 'teams', team.teamSlug]
          : null,
      sourceId: team ? null : sourceId,
    };
  }
}
