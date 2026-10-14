import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { SeasonFormResult } from '@pdz/features/drafts/draft.model';

const LETTER: Record<SeasonFormResult, string> = {
  win: 'W',
  loss: 'L',
  draw: 'D',
};
const LABEL: Record<SeasonFormResult, string> = {
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
};

@Component({
  selector: 'pdz-league-form',
  template: `
    @if (form().length) {
      <ol class="form" [attr.aria-label]="'Recent results: ' + label()">
        @for (result of form(); track $index) {
          <li class="form__pip" [attr.data-result]="result" aria-hidden="true">
            {{ letter[result] }}
          </li>
        }
      </ol>
    }
  `,
  styleUrl: './league-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueFormComponent {
  readonly form = input.required<SeasonFormResult[]>();

  protected readonly letter = LETTER;
  protected readonly label = computed(() =>
    this.form()
      .map((result) => LABEL[result])
      .join(', '),
  );
}
