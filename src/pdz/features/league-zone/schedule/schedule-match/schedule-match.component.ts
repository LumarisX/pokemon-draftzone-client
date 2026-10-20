import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BracketSlotFlex, FlexBracketMatch } from '../bracket.model';
import { MatchupCardComponent } from '@pdz/features/league-zone/matchup-card/matchup-card.component';
import {
  MatchupCard,
  MatchupCardSlot,
} from '@pdz/features/league-zone/matchup-card/matchup-card.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { ScheduleChoice, chooseOne } from '../dialogs/schedule-choice-dialog.component';
import { formatDeadline } from '../schedule-format';
import { ScheduleContext, resolveEntrant } from '../schedule-entrants';
import {
  moveMatchToRound,
  removeMatch,
  setSide,
  slotFromValue,
  slotValue,
  swapSides,
} from '../schedule-edits';
import { SideInput, SideView, matchExit, resolveSide } from '../schedule-sides';
import { ScheduleDraft, stageKeyOf } from '../schedule.model';

@Component({
  selector: 'pdz-schedule-match',
  imports: [
    ButtonComponent,
    MatchupCardComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdz-matchup-card
      [card]="card()"
      [editable]="editable()"
      (focusSource)="focusMatch.emit($event)"
    >
      @if (editable()) {
        <pdz-menu pdz-matchup-card-actions aria-label="Match actions">
          <button
            pdz-button
            pdz-menu-trigger
            iconOnly
            size="xs"
            variant="ghost"
            color="neutral"
            icon="more_vert"
            [attr.aria-label]="'Options for ' + card().label"
          ></button>
          @if (!played()) {
            <button pdz-menu-item icon="edit" (click)="pickSide('a')">
              Change Side 1
            </button>
            <button pdz-menu-item icon="edit" (click)="pickSide('b')">
              Change Side 2
            </button>
            <button pdz-menu-item icon="swap_horiz" (click)="swap()">
              Swap Sides
            </button>
          }
          <button pdz-menu-item icon="event" (click)="moveWeek()">
            Move to Week
          </button>
          @if (!played()) {
            <button pdz-menu-item icon="delete" tone="danger" (click)="remove()">
              Delete Match
            </button>
          }
        </pdz-menu>
      }
    </pdz-matchup-card>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class ScheduleMatchComponent {
  private readonly dialogs = inject(DialogService);

  readonly match = input.required<FlexBracketMatch>();
  readonly draft = input.required<ScheduleDraft>();
  readonly context = input.required<ScheduleContext>();
  readonly labels = input.required<Map<string, string>>();
  readonly editable = input(false);
  readonly matchupLinkBase = input<string[] | null>(null);

  readonly draftChange = output<ScheduleDraft>();
  readonly focusMatch = output<string>();

  protected readonly played = computed(() => {
    const match = this.match();
    return match.winner !== undefined || !!match.forfeit || !!match.advances;
  });

  protected readonly card = computed<MatchupCard>(() => {
    const match = this.match();
    const exit = matchExit(match, this.draft().matches);
    const decided = exit.winner !== null;
    const slots: [MatchupCardSlot, MatchupCardSlot] = [
      this.toSlot(this.side(match, 'a'), exit.winner, 0),
      this.toSlot(this.side(match, 'b'), exit.winner, 1),
    ];
    const base = this.matchupLinkBase();
    const viewLink =
      !this.editable() && base?.length && match.slug && slots.every((s) => !s.pending)
        ? [...base, 'matchups', match.slug]
        : null;
    const deadline = this.draft().rounds[match.round]?.matchDeadline;
    return {
      id: match.id,
      label: this.labels().get(match.id) ?? match.label ?? 'Match',
      decided,
      forfeit: !!match.forfeit,
      advanced: decided && match.winner === undefined,
      slots,
      viewLink,
      breakdownLink: viewLink && !decided ? [...viewLink, 'breakdown'] : null,
      replays: this.editable()
        ? []
        : (match.replays ?? (match.replay ? [match.replay] : [])),
      when: match.scheduledDate
        ? { date: match.scheduledDate, exact: true }
        : deadline
          ? { date: deadline, exact: false }
          : null,
    };
  });

  private toSlot(
    view: SideView,
    winner: 0 | 1 | null,
    index: 0 | 1,
  ): MatchupCardSlot {
    const match = this.match();
    const played = match.winner !== undefined;
    const base = this.matchupLinkBase();
    return {
      name: view.team?.teamName ?? view.name,
      coach: view.team ? (view.detail ?? view.team.coachName) : view.detail,
      logo: view.team?.logo,
      slug: view.team?.teamSlug ?? null,
      pending: !view.team,
      status: winner === null ? 'undecided' : winner === index ? 'winner' : 'loser',
      score: played ? (match.score?.[index] ?? null) : null,
      link:
        !this.editable() && view.team?.teamSlug && base?.length
          ? [...base, 'teams', view.team.teamSlug]
          : null,
      sourceId: view.team ? null : view.sourceId,
    };
  }

  private readonly sideInput = computed<SideInput>(() => {
    const context = this.context();
    return {
      matches: this.draft().matches,
      labels: this.labels(),
      seed: (match, seed) => {
        const stage = context.stages.find((s) => s.key === stageKeyOf(match));
        if (!stage) return { team: null, label: `Seed ${seed}`, detail: null };
        return resolveEntrant(context, stage, seed);
      },
    };
  });

  private side(match: FlexBracketMatch, key: 'a' | 'b'): SideView {
    const view = resolveSide(this.sideInput(), match, key);
    if (match[key].type === 'empty' && this.editable())
      return { ...view, detail: 'Set this side from the menu' };
    return view;
  }

  private emit(draft: ScheduleDraft): void {
    this.draftChange.emit(draft);
  }

  protected async pickSide(side: 'a' | 'b'): Promise<void> {
    const match = this.match();
    const value = await chooseOne(this.dialogs, `Change Side ${side === 'a' ? 1 : 2}`, {
      label: 'Plays In This Match',
      hint: 'A seed from this stage, the result of an earlier match, or TBD.',
      options: this.sideOptions(match, side),
      value: slotValue(match[side]),
      confirmLabel: 'Set Side',
    });
    if (value === undefined) return;
    this.emit(setSide(this.draft(), match.id, side, slotFromValue(value)));
  }

  private sideOptions(match: FlexBracketMatch, side: 'a' | 'b'): ScheduleChoice[] {
    const context = this.context();
    const draft = this.draft();
    const stage = context.stages.find((s) => s.key === stageKeyOf(match));
    const options: ScheduleChoice[] = [];

    stage?.entrants.forEach((_, index) => {
      const resolved = resolveEntrant(context, stage, index + 1);
      options.push({
        value: `seed:${index + 1}`,
        label: `Seed ${index + 1} · ${resolved.label}`,
        group: 'Entrants',
        description: resolved.detail ?? undefined,
      });
    });

    const current = match[side];
    const taken = new Set(
      draft.matches.flatMap((m) =>
        (['a', 'b'] as const)
          .filter((k) => !(m.id === match.id && k === side))
          .map((k) => m[k])
          .filter((slot): slot is Extract<BracketSlotFlex, { from: string }> =>
            slot.type === 'winner' || slot.type === 'loser',
          )
          .map((slot) => `${slot.type}:${slot.from}`),
      ),
    );
    const stageNames = new Map(context.stages.map((s) => [s.key, s.name]));
    for (const earlier of draft.matches
      .filter((m) => m.round < match.round)
      .sort((a, b) => a.round - b.round || a.position - b.position)) {
      const label = this.labels().get(earlier.id) ?? 'Match';
      const group = `Results · ${stageNames.get(stageKeyOf(earlier)) ?? 'Stage'}`;
      for (const type of ['winner', 'loser'] as const) {
        const value = `${type}:${earlier.id}`;
        if (taken.has(value) && slotValue(current) !== value) continue;
        options.push({
          value,
          label: `${type === 'winner' ? 'Winner' : 'Loser'} of ${label}`,
          group,
          description: draft.rounds[earlier.round]?.name,
        });
      }
    }
    options.push({ value: 'empty', label: 'TBD', group: 'Other' });
    return options;
  }

  protected swap(): void {
    this.emit(swapSides(this.draft(), this.match().id));
  }

  protected async moveWeek(): Promise<void> {
    const match = this.match();
    const value = await chooseOne(this.dialogs, 'Move to Week', {
      label: 'Week',
      options: this.draft().rounds.map((round, index) => ({
        value: String(index),
        label: round.name,
        description: round.matchDeadline
          ? `Due ${formatDeadline(round.matchDeadline)}`
          : undefined,
      })),
      value: String(match.round),
      confirmLabel: 'Move Match',
    });
    if (value === undefined) return;
    this.emit(moveMatchToRound(this.draft(), match.id, Number(value)));
  }

  protected remove(): void {
    this.emit(removeMatch(this.draft(), this.match().id));
  }
}
