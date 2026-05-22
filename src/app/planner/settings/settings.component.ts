import { Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { DraftFormGroup } from '../plannner.component';
import { RulesetSelectComponent } from '../../util/ruleset-select/ruleset.component';
import { FormatSelectComponent } from '../../util/format-select/format.component';

@Component({
  selector: 'pdz-planner-settings',
  standalone: true,
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    RulesetSelectComponent,
    FormatSelectComponent,
  ],
})
export class PlannerSettingsComponent {
  @Input()
  draftFormGroup?: DraftFormGroup;

  draftPath = DraftOverviewPath;

  get isPoints() {
    return this.draftFormGroup?.controls.system.value === 'points';
  }

  get teamIds() {
    return this.draftFormGroup?.controls.team.value
      .map((pokemon) => pokemon.pokemon?.id)
      .filter((id) => id != undefined)
      .filter((id) => id != '');
  }
}
