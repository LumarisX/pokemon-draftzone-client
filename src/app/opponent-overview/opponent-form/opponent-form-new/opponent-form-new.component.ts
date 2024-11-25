import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { PokemonFormComponent } from '../../../pokemon-form/pokemon-form.component';
import { SpriteComponent } from '../../../images/sprite.component';
import { OpponentFormCoreComponent } from '../opponent-form-core/opponent-form-core.component';
import { DraftOverviewPath } from '../../../draft-overview/draft-overview-routing.module';

@Component({
  selector: 'opponent-form-new',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    OpponentFormCoreComponent,
    PokemonFormComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './opponent-form-new.component.html',
})
export class OpponentFormNewComponent implements OnInit {
  teamId: string = '';
  title: string = 'New League';
  formats = [];
  rulesets = [];
  opponentForm!: FormGroup;
  readonly draftPath = DraftOverviewPath;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private draftService: DraftService
  ) {}

  ngOnInit() {
    let teamArray: FormGroup[] = [];
    this.opponentForm = new FormGroup({
      teamName: new FormControl('', Validators.required),
      stage: new FormControl('', Validators.required),
      team: new FormArray(teamArray),
    });
    this.teamId = <string>this.route.parent!.snapshot.paramMap.get('teamid');
  }

  newMatchup(formData: Object) {
    this.draftService.newMatchup(this.teamId, formData).subscribe(
      (response) => {
        console.log('Success!', response);
        this.router.navigate([`['/', draftPath]/${this.teamId}`]);
      },
      (error) => console.error('Error!', error)
    );
  }
}
