import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DraftService } from "../../api/draft.service";
import { UserService } from "../../api/user.service";
import { Pokemon } from "../../pokemon";
import { SpriteComponent } from "../../sprite/sprite.component";
import { CoreModule } from "../../sprite/sprite.module";
import { SpriteService } from "../../sprite/sprite.service";
import { pokemonNameValidator } from "../../validators/pokemon.validator";
import { OpponentTeamPreviewComponent } from "../team-preview/opponent-team-preview.component";


@Component({
    selector: 'opponent-form',
    standalone: true,
    imports: [CommonModule, RouterModule, CoreModule, OpponentTeamPreviewComponent, SpriteComponent, ReactiveFormsModule],
    templateUrl: './opponent-form.component.html'
})
export class OpponentFormComponent {

    @Input() teamId: string = "";
    @Output() reload = new EventEmitter<boolean>();


    constructor(private spriteService: SpriteService, private serverServices: UserService, private route: ActivatedRoute, private fb: FormBuilder, private draftService: DraftService) { }

    draftForm = this.fb.group({
        teamName: [''],
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
        this.draftService.newMatchup(this.teamId, this.draftForm.value).subscribe(
            response => {
                console.log("Success!", response)
                this.reload.emit(true)
            },
            error => console.error("Error!", error)
        )
    }
}
