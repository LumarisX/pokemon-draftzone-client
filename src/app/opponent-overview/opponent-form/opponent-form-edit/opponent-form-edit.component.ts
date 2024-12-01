import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../api/draft.service';
import { DraftOverviewPath } from '../../../draft-overview/draft-overview-routing.module';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { Matchup } from '../../../interfaces/matchup';
import { OpponentFormCoreComponent } from '../opponent-form-core/opponent-form-core.component';

@Component({
  selector: 'opponent-form-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentFormCoreComponent,
    ReactiveFormsModule,
    LoadingComponent,
  ],
  templateUrl: './opponent-form-edit.component.html',
})
export class OpponentFormEditComponent implements OnInit {
  teamId: string = '';
  matchupId: string = '';
  readonly draftPath = DraftOverviewPath;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private draftService: DraftService,
    private fb: FormBuilder,
  ) {}

  opponentForm?: FormGroup;
  get teamArray(): FormArray {
    return this.opponentForm?.get('team') as FormArray;
  }

  ngOnInit(): void {
    this.teamId = <string>this.route.parent!.snapshot.paramMap.get('teamid');
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = JSON.parse(params['matchup']);
        this.draftService
          .getMatchup(this.matchupId, this.teamId)
          .subscribe((data) => {
            let matchup = <Matchup>data;
            this.opponentForm = this.fb.group({
              teamName: [matchup.bTeam.teamName, Validators.required],
              stage: [matchup.stage, Validators.required],
              team: [matchup.bTeam.team, Validators.required],
            });
          });
      }
    });
  }

  editMatchup(formData: Object) {
    this.draftService
      .editMatchup(this.matchupId, this.teamId, formData)
      .subscribe(
        (response) => {
          console.log('Success!', response);
          this.router.navigate(['/', this.draftPath, this.teamId]);
        },
        (error) => console.error('Error!', error),
      );
  }
}
