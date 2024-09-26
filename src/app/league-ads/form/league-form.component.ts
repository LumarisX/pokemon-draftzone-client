import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

@Component({
  selector: 'app-league-form',
  templateUrl: './league-form.component.html',
})
export class LeagueFormComponent implements OnInit {
  leagueForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.leagueForm = this.fb.group({
      leagueName: ['', Validators.required],
      organizer: ['', Validators.required],
      description: ['', Validators.required],
      recruitmentStatus: ['Open', Validators.required],
      hostPlatform: ['Discord', Validators.required],
      serverLink: [''],
      divisions: this.fb.array([this.createDivision()]), // Start with one division
      signupLink: ['', Validators.required],
      closesAt: ['', Validators.required],
      seasonStart: ['', Validators.required],
      seasonEnd: ['', Validators.required],
    });
  }

  createDivision(): FormGroup {
    return this.fb.group({
      divisionName: ['', Validators.required],
      skillLevelRange: this.fb.group({
        from: [0, [Validators.min(0), Validators.max(3)]],
        to: [3, [Validators.min(0), Validators.max(3)]],
      }),
      cashValue: [0, [Validators.min(0), Validators.max(3)]],
      platform: ['Pokémon Showdown', Validators.required],
      format: ['Singles', Validators.required],
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
