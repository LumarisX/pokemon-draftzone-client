import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { FormatSelectComponent } from '@pdz/shared/dropdowns/format-select/format.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { DraftFormGroup } from '../planner.component';
import { PlannerWidgetComponent } from '../widget/planner-widget.component';

@Component({
  selector: 'pdz-planner-settings',
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    RulesetSelectComponent,
    FormatSelectComponent,
    PlannerWidgetComponent,
  ],
})
export class PlannerSettingsComponent {
  @Input()
  draftFormGroup?: DraftFormGroup;

  readonly draftPath = DRAFT_OVERVIEW_PATH;

  get teamIds() {
    return this.draftFormGroup?.controls.team.value
      .map((pokemon) => pokemon.pokemon?.id)
      .filter((id) => id != undefined)
      .filter((id) => id != '');
  }
}
