
import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DraftService } from '../../../services/draft.service';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { Opponent } from '../../../interfaces/opponent';
import { DraftOverviewPath } from '../../draft-overview/draft-overview-routing.module';
import {
  OpponentFormCoreComponent,
  OpponentFormData,
} from './opponent-form-core/opponent-form-core.component';
import { Draft } from '../../../interfaces/draft';

@Component({
  selector: 'opponent-form',
  standalone: true,
  imports: [
    RouterModule,
    OpponentFormCoreComponent,
    ReactiveFormsModule,
    MatButtonModule,
    LoadingComponent
],
  styleUrl: './opponent-form.component.scss',
  templateUrl: './opponent-form.component.html',
})
export class OpponentFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private draftService = inject(DraftService);

  teamId: string = '';
  matchupId: string | null = null;
  readonly draftPath = DraftOverviewPath;
  oppParams: Partial<Opponent> | null = null;
  title: string = '';
  isEditMode = false;

  @Input() draft: Draft | undefined;

  ngOnInit(): void {
    this.teamId = this.route.parent!.snapshot.paramMap.get('teamid') ?? '';

    this.route.queryParams.subscribe((params) => {
      if ('matchup' in params) {
        this.isEditMode = true;
        this.title = 'Edit Opponent';
        this.matchupId = params['matchup'];
        this.draftService
          .getOpponent(this.matchupId!, this.teamId)
          .subscribe((opponent) => {
            this.oppParams = opponent;
          });
      } else {
        this.isEditMode = false;
        this.title = 'New Opponent';
        const stage = params['stage'];
        this.oppParams = { stage: stage };
      }
    });
  }

  saveOpponent(formData: OpponentFormData) {
    const serviceCall = this.isEditMode
      ? this.draftService.editMatchup(this.matchupId!, this.teamId, formData)
      : this.draftService.newMatchup(this.teamId, formData);

    serviceCall.subscribe({
      next: () => this.router.navigate(['/', this.draftPath, this.teamId]),
      error: (error) => console.error('Error!', error),
    });
  }
}
