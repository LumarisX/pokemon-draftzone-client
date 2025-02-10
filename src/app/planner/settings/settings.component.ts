import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DraftFormGroup } from '../plannner.component';
import { DataService } from '../../api/data.service';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'planner-settings',
  standalone: true,
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class PlannerSettingsComponent implements OnInit {
  @Input()
  draftFormGroup?: DraftFormGroup;

  draftPath = DraftOverviewPath;
  formats: string[] = [];
  rulesets: string[] = [];

  ngOnInit(): void {
    const dataService = inject(DataService);
    dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  get isPoints() {
    return this.draftFormGroup?.controls.system.value === 'points';
  }

  get teamIds() {
    return this.draftFormGroup?.controls.team.value
      .map((pokemon) => pokemon.id)
      .filter((id) => id != undefined)
      .filter((id) => id != '');
  }
}
