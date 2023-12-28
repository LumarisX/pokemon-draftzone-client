import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../api/draft.service';
import { ServerService } from '../api/server.service';
import { Draft } from '../draft';
import { Pokemon } from '../pokemon';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';
import { pokemonNameValidator } from '../validators/pokemon.validator';
import { OpponentTeamPreviewComponent } from './team-preview/opponent-team-preview.component';


@Component({
  selector: 'opponent-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, OpponentTeamPreviewComponent, SpriteComponent, ReactiveFormsModule],
  templateUrl: './opponent-overview.component.html'
})
export class OpponentOverviewComponent implements OnInit {
  draft!: Draft;
  teamId: string = "";
  formVisible: boolean = false;

  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute, private fb: FormBuilder, private draftService: DraftService) { }

  draftForm = this.fb.group({
    opponentName: [''],
    stage: [''],
    team: this.fb.array([
      {
        pokemonName: "salamencemega" as Pokemon,
        shiny: "false",
        captain: "true"
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
    this.teamId = <string>this.route.snapshot.paramMap.get("teamid");
    this.serverServices.getDraft(this.teamId).subscribe(data => {
      this.draft = <Draft>data;
    });
  }

  spriteDiv(name: string) {
    return this.spriteService.getSprite(name);
  }

  score(a: number[]) {
    let s: string
    if (a.length == 0) {
      s = "0 - 0";
    } else {
      s = `${a[0]}  - ${a[1]}`
    }
    return s;
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
    this.draftService.newOpponent(this.teamId, this.draftForm.value).subscribe(
      response => {
        console.log("Success!", response)
        this.formVisible = false
        this.ngOnInit()
      },
      error => console.error("Error!", error)
    )
  }
}
