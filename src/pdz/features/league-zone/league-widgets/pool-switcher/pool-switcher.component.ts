import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  input,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LeagueZoneService } from '../../league-zone.service';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';

@Component({
  selector: 'pdz-pool-switcher',
  imports: [SegmentedComponent, SegmentedOptionComponent],
  templateUrl: './pool-switcher.component.html',
  styleUrl: './pool-switcher.component.scss',
})
export class PoolSwitcherComponent implements OnInit, OnDestroy {
  private leagueService = inject(LeagueZoneService);
  private readonly destroy$ = new Subject<void>();

  readonly currentPoolSlug = input<string | null>(null);
  @Output() poolSelected = new EventEmitter<string>();

  pools: { name: string; poolSlug: string }[] = [];

  ngOnInit(): void {
    this.leagueService
      .getLeagueInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (info) => {
          this.pools = info.pools ?? [];
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectPool(poolSlug: string): void {
    if (poolSlug === this.currentPoolSlug()) return;
    this.poolSelected.emit(poolSlug);
  }
}
