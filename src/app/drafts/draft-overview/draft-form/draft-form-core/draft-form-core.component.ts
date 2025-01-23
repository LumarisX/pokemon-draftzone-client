import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../../api/data.service';
import { getPidByName, nameList } from '../../../../data/namedex';
import { SelectNoSearchComponent } from '../../../../util/dropdowns/select/select-no-search.component';
import { TeamFormComponent } from '../../../../util/forms/team-form/team-form.component';

@Component({
  selector: 'draft-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    SelectNoSearchComponent,
    TeamFormComponent,
  ],
  templateUrl: './draft-form-core.component.html',
})
export class DraftFormCoreComponent implements OnInit {
  formats: string[] = [];
  rulesets: string[] = [];
  @Input() draftForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  constructor(private dataService: DataService) {}
  names = nameList();

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
    this.draftForm.setValidators(this.validateDraftForm);
  }

  validateDraftForm(control: AbstractControl) {
    const formGroup = control as FormGroup;
    const teamArray = formGroup.get('team') as FormArray;
    if (teamArray.length === 0) {
      return { noTeams: true };
    }
    return null;
  }

  onSubmit() {
    if (this.draftForm.valid) {
      this.formSubmitted.emit(this.draftForm.value);
    } else {
      console.log('Form is invalid.');
    }
  }

  importPokemon(data: string) {
    this.draftForm.get('team')?.setValue(
      data
        .split(/\n|,/)
        .map((string) => string.trim())
        .map((name) => ({
          id: getPidByName(name) ?? '',
          name: name,
        })),
    );
    this.importing = false;
  }
}
