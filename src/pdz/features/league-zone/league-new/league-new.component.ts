import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { FormatSelectComponent } from '@pdz/shared/dropdowns/format-select/format.component';
import { RulesetSelectComponent } from '@pdz/shared/dropdowns/ruleset-select/ruleset.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldErrorDirective } from '@pdz/shared/inputs/field/field-message.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { UploadImageComponent } from '../league/upload-image/upload-image.component';

@Component({
  selector: 'pdz-league-new',
  imports: [
    ReactiveFormsModule,
    PageComponent,
    FieldComponent,
    FieldErrorDirective,
    InputDirective,
    CheckComponent,
    ChoiceDirective,
    SelectComponent,
    SelectOptionComponent,
    RulesetSelectComponent,
    FormatSelectComponent,
    IconComponent,
    ButtonComponent,
    TooltipDirective,
    UploadImageComponent,
  ],
  templateUrl: './league-new.component.html',
  styleUrl: './league-new.component.scss',
})
export class LeagueNewComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);

  leagueForm!: FormGroup;

  bracketTypes = [
    'Round Robin',
    'Swiss',
    'Single Elimination',
    'Double Elimination',
    'Groups',
  ];

  ngOnInit() {
    this._initForm();
  }

  private _initForm(): void {
    this.leagueForm = this._formBuilder.group({
      leagueInfo: this._formBuilder.group({
        leagueName: ['', Validators.required],
        season: ['', Validators.required],
        ruleset: ['', Validators.required],
        format: ['', Validators.required],
        logoUrl: [''],
      }),
      rules: this._formBuilder.group({
        items: this._formBuilder.array([this.createRuleItem()]),
      }),
      divisions: this._formBuilder.group(
        {
          teamCount: [8, [Validators.required, Validators.min(2)]],
          groups: this._formBuilder.array(
            [this.createDivisionGroup()],
            [Validators.required, Validators.minLength(1)],
          ),
        },
        { validators: this.uniqueDivisionNamesValidator },
      ),
      schedule: this._formBuilder.group({
        brackets: this._formBuilder.array([
          this.createBracketItem('Regular Season', 'Round Robin', 1),
          this.createBracketItem('Playoffs', 'Single Elimination', 1),
        ]),
      }),
      settings: this._formBuilder.group({
        invitePrivacy: ['private', Validators.required],
        spectatePrivacy: ['private', Validators.required],
      }),
    });
  }

  get leagueInfoForm(): FormGroup {
    return this.leagueForm.get('leagueInfo') as FormGroup;
  }

  get rulesForm(): FormGroup {
    return this.leagueForm.get('rules') as FormGroup;
  }
  get rulesItems(): FormArray {
    return this.rulesForm.get('items') as FormArray;
  }
  getRulePoints(ruleIndex: number): FormArray {
    return this.rulesItems.at(ruleIndex).get('points') as FormArray;
  }

  get divisionsForm(): FormGroup {
    return this.leagueForm.get('divisions') as FormGroup;
  }
  get divisionGroups(): FormArray {
    return this.divisionsForm.get('groups') as FormArray;
  }

  get scheduleForm(): FormGroup {
    return this.leagueForm.get('schedule') as FormGroup;
  }
  get scheduleBrackets(): FormArray {
    return this.scheduleForm.get('brackets') as FormArray;
  }

  get settingsForm(): FormGroup {
    return this.leagueForm.get('settings') as FormGroup;
  }

  showError(
    parent: AbstractControl | null,
    name: string,
    error = 'required',
  ): boolean {
    const control = parent?.get(name);
    return !!control && control.hasError(error) && control.touched;
  }

  createRuleItem(): FormGroup {
    return this._formBuilder.group({
      title: [''],
      points: this._formBuilder.array([this._formBuilder.control('')]),
    });
  }
  addRuleItem(): void {
    this.rulesItems.push(this.createRuleItem());
  }
  removeRuleItem(index: number): void {
    if (this.rulesItems.length > 0) {
      this.rulesItems.removeAt(index);
    }
  }
  createRulePoint(): FormControl {
    return this._formBuilder.control('');
  }
  addRulePoint(ruleIndex: number): void {
    this.getRulePoints(ruleIndex).push(this.createRulePoint());
  }
  removeRulePoint(ruleIndex: number, pointIndex: number): void {
    const pointsArray = this.getRulePoints(ruleIndex);
    if (pointsArray.length > 1) {
      pointsArray.removeAt(pointIndex);
    } else {
      pointsArray.at(0).setValue('');
    }
  }

  createDivisionGroup(): FormGroup {
    return this._formBuilder.group({
      name: ['', Validators.required],
    });
  }
  addDivisionGroup(): void {
    this.divisionGroups.push(this.createDivisionGroup());
  }
  removeDivisionGroup(index: number): void {
    if (this.divisionGroups.length > 1) {
      this.divisionGroups.removeAt(index);
    }
  }

  createBracketItem(name = '', type = '', stages = 1): FormGroup {
    return this._formBuilder.group({
      name: [name, Validators.required],
      type: [type, Validators.required],
      stages: [stages, [Validators.required, Validators.min(1)]],
    });
  }
  addBracketItem(): void {
    this.scheduleBrackets.push(this.createBracketItem());
  }
  removeBracketItem(index: number): void {
    this.scheduleBrackets.removeAt(index);
  }

  uniqueDivisionNamesValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const groups = control.get('groups') as FormArray;
    if (!groups) {
      return null;
    }
    const names = groups.controls.map((group) =>
      group.get('name')?.value?.toLowerCase()?.trim(),
    );
    const uniqueNames = new Set(names);
    return names.length !== uniqueNames.size
      ? { uniqueDivisionNames: true }
      : null;
  }

  onLogoUploaded(event: { url: string }): void {
    if (event && event.url) {
      this.leagueInfoForm.get('logoUrl')?.setValue(event.url);
    }
  }

  createLeague(): void {
    if (this.leagueForm.valid) {
      console.log(
        'League Creation Data:',
        JSON.stringify(this.leagueForm.value, null, 2),
      );
      alert('League data prepared! Check console.');
    } else {
      console.error('Form is invalid:', this.leagueForm);
      this.leagueForm.markAllAsTouched();
      alert('Please fill out all required fields correctly.');
    }
  }
}
