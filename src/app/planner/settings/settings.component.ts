import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { DraftOverviewPath } from '../../drafts/draft-overview/draft-overview-routing.module';
import { DraftFormGroup } from '../plannner.component';

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

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

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
