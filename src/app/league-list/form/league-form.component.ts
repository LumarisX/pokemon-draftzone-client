import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-league-form',
  templateUrl: './league-form.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styles: `textarea {
    resize: none
  }`,
})
export class LeagueFormComponent implements OnInit {
  leagueForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.leagueForm = this.fb.group({
      leagueName: ['', Validators.required],
      description: ['', Validators.required],
      recruitmentStatus: ['Open', Validators.required],
      hostPlatform: ['Discord', Validators.required],
      serverLink: [''],
      divisions: this.fb.array([this.createDivision()]), // Start with one division
      signupLink: ['', Validators.required],
      closesAt: [
        new Date(Date.now() + 604800000).toISOString().substring(0, 10),
        Validators.required,
      ],
      seasonStart: [],
      seasonEnd: [],
    });
  }

  createDivision(): FormGroup {
    return this.fb.group({
      divisionName: ['', Validators.required],
      skillLevelRange: this.fb.group({
        from: [0, Validators.required],
        to: [3, Validators.required],
      }),
      prizeValue: [0, Validators.required],
      platform: ['Pokémon Showdown', Validators.required],
      format: ['Singles', Validators.required],
      ruleset: ['Singles', Validators.required],
      description: [''],
    });
  }

  get divisions(): FormArray {
    return this.leagueForm.get('divisions') as FormArray;
  }

  addDivision() {
    this.divisions.push(this.createDivision());
  }

  removeDivision(index: number) {
    this.divisions.removeAt(index);
  }

  onSubmit() {
    if (this.leagueForm.valid) {
      // Handle form submission logic here, typically sending the form data to the server
      console.log(this.leagueForm.value);
      // Example: this.leagueService.createLeague(this.leagueForm.value).subscribe();
    }
  }
}
