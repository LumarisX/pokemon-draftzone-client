import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { FormatSelectComponent } from '@pdz/shared/dropdowns/format-select/format.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { DraftFormGroup } from '../planner.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';

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
    TooltipDirective,
  ],
})
export class PlannerSettingsComponent {
  readonly draftFormGroup = input<DraftFormGroup>();

  draftPath = DRAFT_OVERVIEW_PATH;

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
