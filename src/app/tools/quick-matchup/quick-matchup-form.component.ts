import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { getPidByName, Namedex, nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite.component';
import { ImportSVG } from '../../images/svg-components/import.component';
import { Pokemon } from '../../interfaces/draft';
import { PokemonFormComponent } from '../../pokemon-form/pokemon-form.component';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { DraftService } from '../../api/draft.service';

@Component({
  selector: 'quick-matchup-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    PokemonFormComponent,
    ImportSVG,
    ReactiveFormsModule,
    SelectNoSearchComponent,
    SelectSearchComponent,
  ],
  templateUrl: './quick-matchup-form.component.html',
})
export class QuickMatchupFormComponent implements OnInit {
  formats: string[] = [];
  rulesets: string[] = [];
  @Input() draftForm!: FormGroup;
  @Output() formSubmitted = new EventEmitter<FormGroup>();
  importing = false;
  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private draftService: DraftService
  ) {}
  names = nameList();

  get team1Array(): FormArray {
    return this.draftForm?.get('team1') as FormArray;
  }
  get team2Array(): FormArray {
    return this.draftForm?.get('team2') as FormArray;
  }

  ngOnInit(): void {
    let team1Array: AbstractControl[] = [];
    let team2Array: AbstractControl[] = [];
    this.route.queryParams.subscribe((params) => {
      if ('team1' in params)
        team1Array = params['team1'].map((id: string) =>
          PokemonFormComponent.addPokemonForm({
            id: id,
            name: Namedex[id].name[0],
          })
        );
      if ('team2' in params)
        team2Array = params['team2'].map((id: string) =>
          PokemonFormComponent.addPokemonForm({
            id: id,
            name: Namedex[id].name[0],
          })
        );
      this.draftForm = new FormGroup({
        leagueName: new FormControl('', Validators.required),
        teamName: new FormControl('', Validators.required),
        format: new FormControl(
          'format' in params ? params['format'] : '',
          Validators.required
        ),
        ruleset: new FormControl(
          'ruleset' in params ? params['ruleset'] : '',
          Validators.required
        ),
        team1: new FormArray(team1Array),
        team2: new FormArray(team2Array),
      });
    });
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
      //set defaults
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
    this.draftForm.setValidators(this.validateDraftForm);
  }

  @ViewChild(SelectSearchComponent)
  selectSearch!: SelectSearchComponent<Pokemon>;

  addNewPokemon(
    index: number = this.team1Array.length,
    pokemonData: Pokemon = { id: '', name: '' }
  ) {
    this.team1Array?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
    this.selectSearch.clearSelection();
  }

  deletePokemon(index: number) {
    this.team1Array?.removeAt(index);
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
    this.team1Array.clear();
    data
      .split(/\n|,/)
      .map((string) => string.trim())
      .forEach((name) => {
        this.addNewPokemon(this.team1Array.length, {
          id: getPidByName(name) ?? '',
          name: name,
        });
      });
    this.importing = false;
  }
}
