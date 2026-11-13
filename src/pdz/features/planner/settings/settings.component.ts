import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { FormatSelectComponent } from '@pdz/shared/dropdowns/format-select/format.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PlannerContext } from '../planner-context';
import { DraftFormGroup } from '../planner.component';

@Component({
  selector: 'pdz-planner-settings',
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    RulesetSelectComponent,
    FormatSelectComponent,
    IconComponent,
    ButtonComponent,
  ],
})
export class PlannerSettingsComponent {
  readonly draftFormGroup = input<DraftFormGroup>();
  readonly context = input<PlannerContext | null>(null);

  draftPath = DRAFT_OVERVIEW_PATH;

  readonly rules = computed(() => {
    const context = this.context();
    if (!context) return [];
    const size =
      context.min === context.max
        ? `${context.max} Pokémon`
        : `${context.min}–${context.max} Pokémon`;
    return [
      context.format,
      context.ruleset,
      size,
      ...(context.totalPoints ? [`${context.totalPoints} pts`] : []),
    ];
  });

  get isPoints() {
    return this.draftFormGroup()?.controls.system.value === 'points';
  }

  get teamIds() {
    return this.draftFormGroup()
      ?.controls.team.value.map((pokemon) => pokemon.pokemon?.id)
      .filter((id) => id != undefined)
      .filter((id) => id != '');
  }
}
