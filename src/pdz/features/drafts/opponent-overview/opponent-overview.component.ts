import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { DraftService } from '@pdz/features/drafts/draft-overview/draft.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { RouteEnterDirective } from '@pdz/shared/layout/route-enter.directive';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { switchMap } from 'rxjs';

@Component({
  selector: 'pdz-opponent-overview',
  imports: [
    ButtonComponent,
    PageHeaderComponent,
    RecordComponent,
    RouteEnterDirective,
    RouterLink,
    RouterOutlet,
    SpriteComponent,
    TooltipDirective,
  ],
  templateUrl: './opponent-overview.component.html',
  styleUrl: './opponent-overview.component.scss',
})
export class OpponentOverviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly draftService = inject(DraftService);

  readonly backLink = ['/', DRAFT_OVERVIEW_PATH];

  readonly draft = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.draftService.getDraft(params.get('teamId') ?? ''),
      ),
    ),
  );

  draftParam(slug: string): string {
    return JSON.stringify(slug);
  }
}
