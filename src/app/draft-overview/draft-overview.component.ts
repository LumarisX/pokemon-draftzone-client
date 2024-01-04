import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../api/draft.service';
import { ServerService } from '../api/server.service';
import { Draft } from '../interfaces/draft';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';
import { TeamPreviewComponent } from '../team-preview/team-preview.component';
import { pokemonNameValidator } from '../validators/pokemon.validator';
import { Pokemon } from '../pokemon';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, TeamPreviewComponent, SpriteComponent, ReactiveFormsModule],
  templateUrl: './draft-overview.component.html'
})
export class DraftOverviewComponent implements OnInit {
  teams: Draft[] = [];
  formVisible: boolean = false

  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute, private fb: FormBuilder, private draftService: DraftService) { }

  draftForm = this.fb.group({
    leagueName: [''],
    format: ['Singles'],
    ruleset: ['Gen9 NatDex'],
    team: this.fb.array([
      {
        pokemonName: "charizardmegay" as Pokemon,
        shiny: "false",
      }
    ])
  })

  default = {
    pokemonName: '',
    shiny: false,
    captain: true
  }

  pokemonForm = this.fb.group({
    pokemonName: ['', [Validators.required, pokemonNameValidator()]],
    shiny: [false],
    captain: [false]
  })

  ngOnInit() {
    this.serverServices.getDraftsList().subscribe(data => {
      this.teams = <Draft[]>data;
    });
    this.pokemonForm.setValue(this.default)
  }

  spriteDiv(name: string) {
    return this.spriteService.getSprite(name);
  }

  addNewPokemon() {
    if (this.pokemonForm.valid) {
      this.draftFormTeam.push(this.fb.control(this.pokemonForm.value))
      this.pokemonForm.setValue(this.default)
    }
  }

  get draftFormTeam() {
    return this.draftForm.get('team') as FormArray
  }

  //fix depreciated 
  onSubmit() {
    this.draftService.newDraft(this.draftForm.value).subscribe(
      response => {
        console.log("Success!", response)
        this.formVisible = false
        this.ngOnInit()
      },
      error => console.error("Error!", error)
    )
  }
}
