import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { MarkdownModule } from 'ngx-markdown';
import { catchError, map, of } from 'rxjs';
import { waitingMessage } from '../tournament-milestones';

@Component({
  selector: 'pdz-league-rules-overview',
  imports: [
    CardComponent,
    EmptyStateComponent,
    SkeletonLayoutComponent,
    MarkdownModule,
    PageComponent,
    PageHeaderComponent,
  ],
  templateUrl: './league-rules-overview.component.html',
  styleUrl: './league-rules-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueRulesOverviewComponent {
  private readonly leagueZoneService = inject(LeagueZoneService);

  readonly rules = toSignal(
    this.leagueZoneService.getRules().pipe(
      map((sections) =>
        sections.map((section) => ({
          ...section,
          body: section.body.replace(/\t/g, '  '),
        })),
      ),
      catchError(() => of([])),
    ),
  );

  private readonly info = toSignal(
    this.leagueZoneService.getLeagueInfo().pipe(catchError(() => of(null))),
  );

  readonly noRulesMessage = computed(() =>
    waitingMessage(
      "The organizers haven't posted rules for this tournament yet.",
      this.info(),
    ),
  );

  scrollToSection(event: Event, index: number): void {
    event.preventDefault();
    document
      .getElementById(`section-${index}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
