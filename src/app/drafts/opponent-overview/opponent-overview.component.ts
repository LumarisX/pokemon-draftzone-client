import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Draft } from '../../interfaces/draft';
import { DraftService } from '../../services/draft.service';
import { DraftOverviewPath } from '../draft-overview/draft-overview-routing.module';

@Component({
  selector: 'opponent-overview',
  standalone: true,
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
  draftPath = DraftOverviewPath;

  ngOnInit(): void {
    this.draft = this.route.paramMap.pipe(
      switchMap((params) => {
        const teamId = params.get('teamid')!;
        return this.draftService.getDraft(teamId);
      }),
    );
  }
}
