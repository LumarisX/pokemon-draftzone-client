import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DRAFT_OVERVIEW_PATH, TOOLS_PATH } from '@pdz/core/route-paths';
import { DEFAULT_RULESET } from '@pdz/core/rulesets';
import { DataService } from '@pdz/core/services/data.service';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

const MIN_COUNT = 1;
const MAX_COUNT = 20;

@Component({
  selector: 'pdz-random-draft',
  templateUrl: './random-draft.component.html',
  styleUrl: './random-draft.component.scss',
  imports: [
    ButtonComponent,
    CardComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    RouterLink,
    SpriteComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RandomDraftComponent {
  private readonly dataService = inject(DataService);
  private readonly toast = inject(ToastService);

  readonly newDraftLink = ['/', DRAFT_OVERVIEW_PATH, 'new'];
  readonly quickMatchupLink = ['/', TOOLS_PATH, 'quick-matchup'];
  readonly ruleset = DEFAULT_RULESET;
  readonly format = 'Singles';
  readonly min = MIN_COUNT;
  readonly max = MAX_COUNT;

  readonly count = signal(12);
  readonly team = signal<DraftPokemon[]>([]);
  readonly rolling = signal(false);

  readonly teamParams = computed(() => ({
    team: this.team().map((pokemon) => pokemon.id),
    format: this.format,
    ruleset: this.ruleset,
  }));

  setCount(value: string): void {
    const parsed = Math.trunc(Number(value));
    if (!Number.isFinite(parsed)) return;
    this.count.set(Math.min(MAX_COUNT, Math.max(MIN_COUNT, parsed)));
  }

  roll(): void {
    this.rolling.set(true);
    this.dataService
      .getRandom(this.count(), this.ruleset, this.format)
      .subscribe({
        next: (team) => {
          this.team.set(team);
          this.rolling.set(false);
        },
        error: (error) => {
          this.rolling.set(false);
          this.toast.error(apiErrorMessage(error, 'Could not roll a team.'));
        },
      });
  }
}
