import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';
import { Observable, switchMap } from 'rxjs';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { Draft } from '@pdz/features/drafts/draft.model';

@Component({
  selector: 'pdz-legacy-draft-shell',
  imports: [
    AsyncPipe,
    JsonPipe,
    RouterModule,
    ReactiveFormsModule,
    IconComponent,
    SpriteComponent,
    RouteEnterDirective,
    ButtonComponent,
  ],
  templateUrl: './legacy-draft-shell.component.html',
  styleUrl: './legacy-draft-shell.component.scss',
})
export class LegacyDraftShellComponent implements OnInit {
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
