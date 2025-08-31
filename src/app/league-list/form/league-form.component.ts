import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LeagueAdsService } from '../../services/league-ads.service';
import { DataService } from '../../services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-league-form',
  templateUrl: './league-form.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  styles: `
    textarea {
      resize: none;
    }
  `,
})
export class LeagueFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private leagueService = inject(LeagueAdsService);
  private dataService = inject(DataService);
  private router = inject(Router);

  leagueForm!: FormGroup;
  formats: string[] = [];
  rulesets: string[] = [];

  ngOnInit(): void {
    this.leagueForm = this.fb.group({
      leagueName: ['', Validators.required],
      description: ['', Validators.required],
      hostLink: ['', Validators.required],
      serverLink: [''],
      divisions: this.fb.array([this.createDivision()]),
      signupLink: ['', Validators.required],
      closesAt: [
        new Date(Date.now() + 604800000).toISOString().substring(0, 10),
        Validators.required,
      ],
      seasonStart: [],
      seasonEnd: [],
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }

  createDivision(): FormGroup {
    return this.fb.group({
      divisionName: ['', Validators.required],
      skillLevelRange: this.fb.group({
        from: ['0', Validators.required],
        to: ['3', Validators.required],
      }),
      prizeValue: ['0', Validators.required],
      platform: ['Pokémon Showdown', Validators.required],
      format: ['Singles', Validators.required],
      ruleset: ['Gen9 NatDex', Validators.required],
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
      this.leagueService.newAd(this.leagueForm.value).subscribe(() => {
        this.router.navigate(['/league-list/manage']);
      });
    }
  }
}
