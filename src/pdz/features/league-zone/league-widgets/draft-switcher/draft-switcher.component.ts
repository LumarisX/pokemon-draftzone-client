import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';

/**
 * Picks which draft pool a page is looking at, the way
 * `pdz-stage-switcher` picks a stage.
 *
 * Anything scoped to who drafted together — trades, free agency — belongs on
 * this axis rather than the stage one: a Pokémon another pool drafted is still
 * free here, and a team from another pool is never a trade partner.
 */
@Component({
  selector: 'pdz-draft-switcher',
  templateUrl: './draft-switcher.component.html',
  styleUrl: './draft-switcher.component.scss',
})
export class DraftSwitcherComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  @Input() currentDraftSlug: string | null = null;
  @Output() draftSelected = new EventEmitter<string>();

  drafts: { name: string; draftSlug: string }[] = [];

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.drafts = info.drafts ?? [];
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectDraft(draftSlug: string): void {
    if (draftSlug === this.currentDraftSlug) return;
    this.draftSelected.emit(draftSlug);
  }
}
