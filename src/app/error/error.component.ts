import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DraftService } from '../api/draft.service';
import { Draft } from '../interfaces/draft';
import { Pokemon } from '../pokemon';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoreModule } from '../sprite/sprite.module';
import { SpriteService } from '../sprite/sprite.service';
import { pokemonNameValidator } from '../validators/pokemon.validator';

@Component({
  selector: 'error',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule, SpriteComponent, ReactiveFormsModule],
  templateUrl: './error.component.html'
})
export class ErrorComponent {

  constructor() { }

}
