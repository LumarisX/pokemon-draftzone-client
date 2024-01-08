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

    filter(input: string) {
    }
}
