import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../../services/draft.service';
import { LoadingComponent } from '../../../../images/loading/loading.component';
import { Opponent } from '../../../../interfaces/opponent';
import { DraftOverviewPath } from '../../../draft-overview/draft-overview-routing.module';
import { OpponentFormCoreComponent } from '../opponent-form-core/opponent-form-core.component';

@Component({
  selector: 'opponent-form-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentFormCoreComponent,
    ReactiveFormsModule,
    MatButtonModule,
    LoadingComponent,
  ],
  styleUrl: '../opponent-form.component.scss',
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
  ) {}
  oppParams!: Opponent;

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') ?? '';
    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.matchupId = params['matchup'];
        this.draftService
          .getOpponent(this.matchupId, this.teamId)
          .subscribe((opponent) => {
            this.oppParams = opponent;
            console.log(this.oppParams);
          });
      }
    });
  }

  editMatchup(formData: Object) {
    console.log(formData);
    this.draftService
      .editMatchup(this.matchupId, this.teamId, formData)
      .subscribe({
        next: (response) => {
          setTimeout(() => {
            console.log('Success!', response);
            this.router.navigate(['/', this.draftPath, this.teamId]);
          }, 1000);
        },
        error: (error) => console.error('Error!', error),
      });
  }
}
