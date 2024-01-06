import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { SpriteComponent } from "../../../sprite/sprite.component";
import { CoreModule } from "../../../sprite/sprite.module";

@Component({
    selector: 'pokemon-form',
    standalone: true,
    imports: [CommonModule, RouterModule, CoreModule, SpriteComponent, ReactiveFormsModule],
    templateUrl: './pokemon-form.component.html'
})
export class PokemonFormComponent {

    @Input() pokemonForm!: FormGroup;
    @Input() formIndex!: number;
    @Output() deletePokemonEvent = new EventEmitter<number>;
    @Output() addPokemonEvent = new EventEmitter<string>;

    constructor(private fb: FormBuilder) { }

    static addPokemonForm(pokemonData: string = ''): FormGroup {
        return new FormGroup({
            pokemonName: new FormControl(pokemonData),
            shiny: new FormControl(false),
            captain: new FormControl(false)
        })
    }

    deleteForm(index: number) {
        this.deletePokemonEvent.emit(index)
    }

    filter(input: string) {
        // if (input != '') {
        //     let lines = input.split(/\r?\n/)
        //     if (lines.length > 1) {
        //         //this.pokemonForm.get('pokemonName')?.setValue(this.pokemonForm.get('pokemonName') + words[0])
        //         //for (let word of words) {
        //         this.addPokemonEvent.emit()
        //         //}
        //     }
        // }
    }

    testEnter() {
        this.addPokemonEvent.emit()
    }
}
