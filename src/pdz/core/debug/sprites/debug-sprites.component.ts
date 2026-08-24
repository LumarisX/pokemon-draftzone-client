import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { nameList } from '@pdz/shared/data/namedex';
import { SpriteImageComponent } from '@pdz/shared/images/sprite-image/sprite-image.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';

type Filter = 'all' | 'fallback' | 'missing';

@Component({
  selector: 'pdz-debug-sprites',
  templateUrl: './debug-sprites.component.html',
  styleUrl: './debug-sprites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SpriteImageComponent,
    TooltipDirective,
    PageComponent,
    ChoiceDirective,
    CheckComponent,
    FieldComponent,
    InputDirective,
    SegmentedComponent,
    SegmentedOptionComponent,
    FormsModule,
  ],
})
export class DebugSpritesComponent {
  protected readonly shiny = signal(false);
  protected readonly search = signal('');
  protected readonly filter = signal<Filter>('all');

  private readonly all = nameList();

  protected readonly rows = computed(() => {
    const shiny = this.shiny();
    const term = this.search().trim().toLowerCase();
    const matches = term
      ? this.all.filter(
          (entry) =>
            entry.id.includes(term) || entry.name.toLowerCase().includes(term),
        )
      : this.all;
    return matches.map((entry) => ({ ...entry, shiny }));
  });

  protected stepLabel(step: number, last: number): string {
    if (step === 0) return 'primary';
    if (step >= last) return 'missing';
    return `fallback ${step}`;
  }
}
