import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
} from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DraftService } from '../../api/draft.service';
import { UserService } from '../../api/user.service';
import { PokemonFormComponent } from '../../opponent-overview/opponent-form/pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../sprite/sprite.component';
import { CoreModule } from '../../sprite/sprite.module';
import { SpriteService } from '../../sprite/sprite.service';

@Component({
  selector: 'draft-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form.component.html',
})
export class DraftFormComponent implements OnInit {
  teamId: string = '';

  constructor(
    private spriteService: SpriteService,
    private serverServices: UserService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private draftService: DraftService
  ) {}

  draftForm!: FormGroup;

  get teamArray(): FormArray {
    return this.draftForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.draftForm = new FormGroup({
      leagueName: new FormControl(''),
      teamName: new FormControl(''),
      format: new FormControl(''),
      ruleset: new FormControl(''),
      team: new FormArray([PokemonFormComponent.addPokemonForm()]),
    });
  }

  spriteDiv(name: string) {
    return this.spriteService.getSprite(name);
  }

  addNewPokemon(
    index: number = this.teamArray.length,
    pokemonData: string = ''
  ) {
    console.log(index);
    this.teamArray?.insert(
      index + 1,
      PokemonFormComponent.addPokemonForm(pokemonData)
    );
  }

  deletePokemon(index: number) {
    this.teamArray?.removeAt(index);
  }

  //fix depreciated
  onSubmit() {
    this.draftService.newMatchup(this.teamId, this.draftForm.value).subscribe(
      (response) => {
        console.log('Success!', response);
      },
      (error) => console.error('Error!', error)
    );
  }
}
