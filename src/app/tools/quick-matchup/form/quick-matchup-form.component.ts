import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../api/data.service';
import { TeraType } from '../../../data';
import { SelectNoSearchComponent } from '../../../util/dropdowns/select/select-no-search.component';
import { TeamFormComponent } from '../../../util/forms/team-form/team-form.component';
import { Pokemon } from '../../../interfaces/draft';

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
  draftForm!: FormGroup;
  @Input() formData?: {
    format: string;
    ruleset: string;
    team1: Pokemon[];
    team2: Pokemon[];
  };
  @Output() formSubmitted = new EventEmitter<{
    format: string;
    ruleset: string;
    team1: Pokemon[];
    team2: Pokemon[];
  }>();
  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.draftForm = this.fb.group({
      format: [this.formData?.format ?? 'Singles', Validators.required],
      ruleset: [this.formData?.ruleset ?? 'Gen9 NatDex', Validators.required],
      team1: [this.formData?.team1 ?? []],
      team2: [this.formData?.team2 ?? []],
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });
    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
  }
  onSubmit() {
    if (this.draftForm.valid) {
      let formData: {
        format: string;
        ruleset: string;
        team1: {
          id: string;
          name: string;
          shiny: boolean;
          captCheck: boolean | null;
          capt: {
            z: boolean;
            teraCheck: boolean | null;
            tera: { [key in TeraType]: boolean };
          };
        }[];
        team2: {
          id: string;
          name: string;
          shiny: boolean;
          captCheck: boolean | null;
          capt: {
            z: boolean;
            teraCheck: boolean | null;
            tera: { [key in TeraType]: boolean };
          };
        }[];
      } = this.draftForm.value;
      console.log(formData);
      this.formSubmitted.emit({
        format: formData.format,
        ruleset: formData.ruleset,
        team1: formData.team1.map((pokemonData) => {
          const tera = Object.entries(pokemonData.capt?.tera || [])
            .filter((e) => e[1])
            .map((e) => e[0]);
          const capt = pokemonData.captCheck
            ? {
                z: pokemonData.capt?.z,
                tera: pokemonData.capt.teraCheck ? tera : undefined,
              }
            : undefined;
          return {
            id: pokemonData.id,
            name: pokemonData.name,
            shiny: pokemonData.shiny,
            capt: capt,
          };
        }),
        team2: formData.team2.map((pokemonData) => {
          const tera = Object.entries(pokemonData.capt?.tera || [])
            .filter((e) => e[1])
            .map((e) => e[0]);
          const capt = pokemonData.captCheck
            ? {
                z: pokemonData.capt?.z,
                tera: pokemonData.capt.teraCheck ? tera : undefined,
              }
            : undefined;
          return {
            id: pokemonData.id,
            name: pokemonData.name,
            shiny: pokemonData.shiny,
            capt: capt,
          };
        }),
      });
    } else {
      console.log('Form is invalid.');
    }
  }
}
