import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FlexBracketMatch } from '@pdz/features/league-zone/schedule/bracket.model';
import { ScheduleContext } from '../schedule-entrants';
import { ScheduleDraft } from '../schedule.model';
import { ScheduleMatchComponent } from './schedule-match.component';

@Component({
  selector: 'pdz-schedule-match-grid',
  imports: [ScheduleMatchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid">
      @for (match of matches(); track match.id) {
        <pdz-schedule-match
          [attr.data-match-id]="match.id"
          [match]="match"
          [draft]="draft()"
          [context]="context()"
          [labels]="labels()"
          [editable]="editable()"
          [matchupLinkBase]="matchupLinkBase()"
          (draftChange)="draftChange.emit($event)"
          (focusMatch)="focusMatch.emit($event)"
        />
      } @empty {
        <p class="grid__empty">
          {{ editable() ? "No matches this week. Use Add Match to start one." : "No matches this week." }}
        </p>
      }
    </div>
  `,
  styleUrl: './schedule-match-grid.component.scss',
})
export class ScheduleMatchGridComponent {
  readonly matches = input.required<FlexBracketMatch[]>();
  readonly draft = input.required<ScheduleDraft>();
  readonly context = input.required<ScheduleContext>();
  readonly labels = input.required<Map<string, string>>();
  readonly editable = input(false);
  readonly matchupLinkBase = input<string[] | null>(null);

  readonly draftChange = output<ScheduleDraft>();
  readonly focusMatch = output<string>();
}
