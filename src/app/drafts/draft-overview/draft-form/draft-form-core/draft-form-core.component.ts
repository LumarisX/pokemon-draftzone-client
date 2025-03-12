import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder,
  AbstractControl,
  FormArray,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../../api/data.service';
import { getPidByName } from '../../../../data/namedex';
import { Pokemon } from '../../../../interfaces/draft';
import { FormatSelectComponent } from '../../../../util/format-select/format.component';
import { TeamFormComponent } from '../../../../util/forms/team-form/team-form.component';
import { RulesetSelectComponent } from '../../../../util/ruleset-select/ruleset.component';

@Component({
  selector: 'draft-form-core',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatStepperModule,
    MatIconModule,
    FormatSelectComponent,
    TeamFormComponent,
    RulesetSelectComponent,
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: {
        displayDefaultIndicatorType: false,
        useValue: { showError: true },
      },
    },
  ],
  templateUrl: './draft-form-core.component.html',
  styleUrl: './draft-form-core.component.scss',
})
export class DraftFormCoreComponent implements OnInit {
  formats: string[] = [];
  rulesets: string[] = [];
  @Input() draftForm!: FormGroup<{
    details: FormGroup<{
      leagueName: FormControl<string | null>;
      teamName: FormControl<string | null>;
      format: FormControl<string | null>;
      ruleset: FormControl<string | null>;
      doc: FormControl<string | null>;
    }>;
    team: FormControl<Pokemon[] | null>;
  }>;
  @Output() formSubmitted = new EventEmitter<
    Partial<{
      details: Partial<{
        leagueName: string | null;
        teamName: string | null;
        format: string | null;
        ruleset: string | null;
        doc: string | null;
      }>;
      team: Pokemon[] | null;
    }>
  >();
  importing = false;
  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
  ) {}
  detailsForm!: FormGroup;

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

  openLink(url: string) {
    let trimmed = url.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    window.open(trimmed, '_blank');
  }
}
