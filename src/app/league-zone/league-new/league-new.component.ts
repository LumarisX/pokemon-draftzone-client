import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule

// Import Angular Material Modules needed for the stepper and form controls
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

// Assuming your pdz-upload-button component exists and is standalone or declared elsewhere
// If it's standalone, add it to the imports array below
// import { PdzUploadButtonComponent } from './path/to/pdz-upload-button.component';

@Component({
  selector: 'pdz-league-new',
  standalone: true, // Make it a standalone component
  imports: [
    CommonModule, // Provides *ngIf, *ngFor etc.
    ReactiveFormsModule, // Provides form directives
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    // PdzUploadButtonComponent, // <-- Add your upload button component here if it's standalone
  ],
  templateUrl: './league-new.component.html',
  styleUrl: './league-new.component.scss',
})
export class LeagueNewComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);

  // --- Form Definitions ---
  leagueForm!: FormGroup;

  // --- Data for Selects ---
  rulesets = [
    'Nat Dex Gen 9',
    'Paldea Dex',
    'Unova Dex',
    'OU',
    'Ubers',
    'Custom',
  ];
  formats = [
    'Singles',
    'Doubles (VGC)',
    'Little Cup',
    'Monotype',
    'Draft',
    'Custom',
  ];
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
      // Step 1: League Info
      leagueInfo: this._formBuilder.group({
        leagueName: ['', Validators.required],
        season: ['', Validators.required],
        ruleset: ['', Validators.required],
        format: ['', Validators.required],
        logoUrl: [''], // Assuming pdz-upload-button will provide a URL or identifier
      }),
      // Step 2: Rules (Optional - control is handled by previous step being valid)
      rules: this._formBuilder.group({
        items: this._formBuilder.array([this.createRuleItem()]), // Start with one empty rule section
      }),
      // Step 3: Divisions
      divisions: this._formBuilder.group(
        {
          teamCount: [8, [Validators.required, Validators.min(2)]], // Default to 8 teams, min 2
          groups: this._formBuilder.array(
            [this.createDivisionGroup()], // Start with one division
            [Validators.required, Validators.minLength(1)], // Must have at least one division
          ),
        },
        { validators: this.uniqueDivisionNamesValidator },
      ), // Add custom validator for unique names
      // Step 4: Schedule (Optional - control handled by previous step)
      schedule: this._formBuilder.group({
        brackets: this._formBuilder.array([
          // Pre-populate default brackets
          this.createBracketItem('Regular Season', 'Round Robin', 1),
          this.createBracketItem('Playoffs', 'Single Elimination', 1),
        ]),
      }),
      // Step 5: Confirmation & Settings
      settings: this._formBuilder.group({
        invitePrivacy: ['private', Validators.required], // Default to private
        spectatePrivacy: ['private', Validators.required], // Default to private
      }),
    });
  }

  // --- Form Getters for Easier Template Access ---

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

  // --- FormArray Manipulation Methods ---

  // Rules
  createRuleItem(): FormGroup {
    return this._formBuilder.group({
      title: [''], // Title is optional per rule section
      points: this._formBuilder.array([this._formBuilder.control('')]), // Start with one bullet point
    });
  }
  addRuleItem(): void {
    this.rulesItems.push(this.createRuleItem());
  }
  removeRuleItem(index: number): void {
    if (this.rulesItems.length > 0) {
      // Prevent removing the last one if desired, or allow removing all
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
      // Keep at least one point input usually
      pointsArray.removeAt(pointIndex);
    } else {
      // Optional: Clear the last point instead of removing the input field
      pointsArray.at(0).setValue('');
    }
  }

  // Divisions
  createDivisionGroup(): FormGroup {
    return this._formBuilder.group({
      name: ['', Validators.required], // Division name is required
    });
  }
  addDivisionGroup(): void {
    this.divisionGroups.push(this.createDivisionGroup());
  }
  removeDivisionGroup(index: number): void {
    if (this.divisionGroups.length > 1) {
      // Must keep at least one division
      this.divisionGroups.removeAt(index);
    }
  }

  // Schedule Brackets
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
    // Allow removing all brackets since the step is optional, or enforce min 1 if needed
    this.scheduleBrackets.removeAt(index);
  }

  // --- Custom Validators ---
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

  // --- Logo Handling ---
  // Example function to handle logo upload event from pdz-upload-button
  // You'll need to adapt this based on how pdz-upload-button emits data
  onLogoUploaded(event: { url: string }): void {
    if (event && event.url) {
      this.leagueInfoForm.get('logoUrl')?.setValue(event.url);
      console.log('Logo URL set:', event.url);
    }
  }

  // --- Submission ---
  createLeague(): void {
    if (this.leagueForm.valid) {
      console.log(
        'League Creation Data:',
        JSON.stringify(this.leagueForm.value, null, 2),
      );
      // TODO: Send data to your backend service
      // e.g., this.leagueService.create(this.leagueForm.value).subscribe(...)
      alert('League data prepared! Check console.');
    } else {
      console.error('Form is invalid:', this.leagueForm);
      // Optionally mark all fields as touched to show errors
      this.leagueForm.markAllAsTouched();
      alert('Please fill out all required fields correctly.');
    }
  }
}

// Helper type (optional but good practice)
interface RuleItem {
  title: string;
  points: string[];
}
interface DivisionGroup {
  name: string;
}
interface ScheduleBracket {
  name: string;
  type: string;
  stages: number;
}
interface LeagueData {
  leagueInfo: {
    leagueName: string;
    season: string;
    ruleset: string;
    format: string;
    logoUrl?: string;
  };
  rules: {
    items: RuleItem[];
  };
  divisions: {
    teamCount: number;
    groups: DivisionGroup[];
  };
  schedule: {
    brackets: ScheduleBracket[];
  };
  settings: {
    invitePrivacy: 'public' | 'private';
    spectatePrivacy: 'public' | 'private';
  };
}
