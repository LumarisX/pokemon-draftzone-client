import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';
import { Observable, switchMap } from 'rxjs';
import { DraftService } from '../draft-overview/draft.service';
import { Draft } from '../draft.model';

@Component({
  selector: 'pdz-opponent-overview',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    SpriteComponent,
    RouteEnterDirective,
    ButtonComponent,
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
