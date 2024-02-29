import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { CoreModule } from '../../../sprite/sprite.module';
import { DraftFormCoreComponent } from '../draft-form-core/draft-form-core.component';
import { DraftService } from '../../../api/draft.service';

@Component({
  selector: 'draft-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CoreModule,
    SpriteComponent,
    DraftFormCoreComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './draft-form-new.component.html',
})
export class DraftFormNewComponent {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];

  constructor(private router: Router, private draftService: DraftService) {}

  draftForm: FormGroup = new FormGroup({
    leagueName: new FormControl('', Validators.required),
    teamName: new FormControl('', Validators.required),
    format: new FormControl('', Validators.required),
    ruleset: new FormControl('', Validators.required),
    team: new FormArray([PokemonFormComponent.addPokemonForm()]),
  });

  newDraft(formData: Object) {
    this.draftService.newDraft(formData).subscribe(
      (response) => {
        console.log('Success!', response);
        // Redirect to '/draft' route
        this.router.navigate(['/draft']);
      },
      (error) => console.error('Error!', error)
    );
  }
}
