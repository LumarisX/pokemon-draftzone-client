import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { HelpComponent } from '@pdz/shared/help/help.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChoiceCardComponent } from '@pdz/shared/inputs/choice-cards/choice-card.component';
import { ChoiceCardsComponent } from '@pdz/shared/inputs/choice-cards/choice-cards.component';
import {
  QUICK_SETUP,
  QuickSetupContext,
  QuickSetupQuestion,
} from './quick-setup';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-quick-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChoiceCardComponent,
    ChoiceCardsComponent,
    HelpComponent,
    IconComponent,
  ],
  templateUrl: './quick-setup.component.html',
  styleUrl: './quick-setup.component.scss',
})
export class QuickSetupComponent {
  private readonly store = inject(TournamentSettingsStore);

  readonly adjust = output<string>();

  protected readonly shapeHelp =
    'A season is built from stages on the Schedule. A round robin has every team play every other team; Swiss pairs teams with similar records each round; elimination knocks teams out, often as playoffs after a round robin.';

  private readonly context = computed<QuickSetupContext>(() => ({
    settings: this.store.draft(),
    pools: this.store.pools(),
    format: this.store.artifacts().tierList.format,
    standingsLocked: this.store.isLocked('standings'),
  }));

  protected readonly rows = computed(() => {
    const context = this.context();
    return QUICK_SETUP.map((question) => {
      const current = question.current(context);
      const unavailable = question.unavailable?.(context) ?? null;
      return {
        question,
        current,
        unavailable,
        custom: !unavailable && current === null && context.pools.length > 0,
        recommended: question.recommended?.(context) ?? null,
        recommendedNote: `Suggested for your ${context.format} tier list`,
      };
    });
  });

  protected readonly schedule = computed(() => this.store.artifacts().schedule);

  protected choose(question: QuickSetupQuestion, value: unknown): void {
    if (typeof value !== 'string') return;
    if (value === question.current(this.context())) return;
    this.store.applyPatch(question.apply(value));
  }
}
