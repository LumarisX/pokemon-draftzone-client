import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DraftService } from "../../api/draft.service";
import { UserService } from "../../api/user.service";
import { SpriteComponent } from "../../sprite/sprite.component";
import { CoreModule } from "../../sprite/sprite.module";
import { SpriteService } from "../../sprite/sprite.service";
import { PokemonFormComponent } from "./pokemon-form/pokemon-form.component";


@Component({
    selector: 'opponent-form',
    standalone: true,
    imports: [CommonModule, RouterModule, CoreModule, SpriteComponent, PokemonFormComponent, ReactiveFormsModule],
    templateUrl: './opponent-form.component.html'
})
export class OpponentFormComponent implements OnInit {

    @Input() teamId: string = "";
    @Output() reload = new EventEmitter<boolean>();


    constructor(private spriteService: SpriteService, private serverServices: UserService, private route: ActivatedRoute, private fb: FormBuilder, private draftService: DraftService) { }

    draftForm!: FormGroup

    get teamArray(): FormArray {
        return this.draftForm?.get('team') as FormArray
    }

    ngOnInit(): void {
        this.draftForm = new FormGroup({
            teamName: new FormControl(''),
            stage: new FormControl(''),
            team: new FormArray([
                PokemonFormComponent.addPokemonForm()
            ])
        })
    }

    spriteDiv(name: string) {
        return this.spriteService.getSprite(name);
    }

    addNewPokemon(index: number = this.teamArray.length, pokemonData: string = '') {
        console.log(index)
        this.teamArray?.insert(index + 1, PokemonFormComponent.addPokemonForm(pokemonData))
    }

    deletePokemon(index: number) {
        this.teamArray?.removeAt(index)
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
