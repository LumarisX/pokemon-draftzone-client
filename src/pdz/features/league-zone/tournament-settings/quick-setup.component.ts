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
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
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
    SegmentedComponent,
    SegmentedOptionComponent,
  ],
  templateUrl: './quick-setup.component.html',
  styleUrl: './quick-setup.component.scss',
})
export class QuickSetupComponent {
  private readonly store = inject(TournamentSettingsStore);

  readonly adjust = output<string>();

  private readonly context = computed<QuickSetupContext>(() => ({
    settings: this.store.draft(),
    pools: this.store.pools(),
    format: this.store.artifacts().tierList.format,
  }));

  protected readonly rows = computed(() => {
    const context = this.context();
    return QUICK_SETUP.map((question) => {
      const current = question.current(context);
      const unavailable = question.unavailable?.(context) ?? null;
      const recommended = question.recommended?.(context) ?? null;
      const chosen = question.options.find((option) => option.value === current);
      const suggestion =
        recommended && recommended !== current
          ? question.options.find((option) => option.value === recommended)
          : null;
      return {
        question,
        current,
        unavailable,
        summary: unavailable ?? chosen?.summary ?? 'Custom. Adjust it below.',
        custom: !unavailable && !chosen,
        suggestion:
          suggestion && !unavailable
            ? {
                text: `Your ${context.format} tier list usually plays as ${suggestion.label}.`,
                action: `Use ${suggestion.label}`,
                value: suggestion.value,
              }
            : null,
      };
    });
  });

  protected readonly schedule = computed(() => this.store.artifacts().schedule);

  protected choose(question: QuickSetupQuestion, value: string): void {
    if (value === question.current(this.context())) return;
    this.store.applyPatch(question.apply(value));
  }
}
