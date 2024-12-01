import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { getPidByName, nameList } from '../../../data/namedex';
import { TeamFormComponent } from '../../../util/forms/team-form/team-form.component';

@Component({
  selector: 'opponent-form-core',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TeamFormComponent],
  templateUrl: './opponent-form-core.component.html',
})
export class OpponentFormCoreComponent implements OnInit {
  @Input() opponentForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  names = nameList();
  constructor() {}

  teamControl?: AbstractControl;

  ngOnInit(): void {
    this.opponentForm.setValidators(this.validateDraftForm);
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
    if (this.opponentForm.valid) {
      this.formSubmitted.emit(this.opponentForm.value);
    } else {
      console.log('Form is invalid.');
    }
  }

  importPokemon(data: string) {
    this.opponentForm.get('team')?.setValue(
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
