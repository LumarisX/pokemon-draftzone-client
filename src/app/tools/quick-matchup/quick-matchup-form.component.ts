import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { TeamFormComponent } from './team-form.component';

@Component({
  selector: 'quick-matchup-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SelectNoSearchComponent,
    TeamFormComponent,
  ],
  templateUrl: './quick-matchup-form.component.html',
})
export class QuickMatchupFormComponent {
  formats: string[] = [];
  rulesets: string[] = [];
  @Input() draftForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  constructor(private dataService: DataService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.draftForm = this.fb.group({
      format: ['Singles', Validators.required],
      ruleset: ['Gen9 Natdex', Validators.required],
      team1: [],
      team2: [],
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
      //set defaults
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }
  onSubmit() {
    if (this.draftForm.valid) {
      this.formSubmitted.emit(this.draftForm.value);
    } else {
      console.log('Form is invalid.');
    }
  }
}
