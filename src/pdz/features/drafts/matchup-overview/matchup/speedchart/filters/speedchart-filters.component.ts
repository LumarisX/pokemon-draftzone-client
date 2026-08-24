import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';

export type ModifierForms = FormGroup<{
  [key: string]: FormArray<FormControl<boolean>>;
}>;

@Component({
  selector: 'pdz-speedchart-filters',
  templateUrl: './speedchart-filters.component.html',
  styleUrl: './speedchart-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ChoiceDirective,
    IconComponent,
    MenuComponent,
    MenuTriggerDirective,
    ReactiveFormsModule,
  ],
})
export class SpeedchartFiltersComponent {
  readonly modifiers = input.required<ModifierForms>();
  readonly reset = output<void>();

  protected readonly rows = computed(() =>
    Object.entries(this.modifiers().controls)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, teams]) => ({
        name,
        own: teams.at(0),
        opponent: teams.at(1),
      })),
  );
}
