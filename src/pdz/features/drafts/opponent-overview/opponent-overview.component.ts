import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { Draft } from '../draft.model';
import { DraftService } from '../draft-overview/draft.service';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';

@Component({
  selector: 'pdz-opponent-overview',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    SpriteComponent,
  ],
  templateUrl: './opponent-overview.component.html',
  styleUrl: './opponent-overview.component.scss',
})
export class OpponentOverviewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private draftService = inject(DraftService);

  draft!: Observable<Draft>;
  draftPath = DRAFT_OVERVIEW_PATH;

  ngOnInit(): void {
    this.draft = this.route.paramMap.pipe(
      switchMap((params) => {
        const teamId = params.get('teamId')!;
        return this.draftService.getDraft(teamId);
      }),
    );
  }
}
