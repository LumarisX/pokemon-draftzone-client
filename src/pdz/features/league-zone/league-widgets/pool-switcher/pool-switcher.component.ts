import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'pdz-pool-switcher',
  imports: [SegmentedComponent, SegmentedOptionComponent],
  templateUrl: './pool-switcher.component.html',
  styleUrl: './pool-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolSwitcherComponent {
  private leagueService = inject(LeagueZoneService);

  readonly currentPoolSlug = input<string | null>(null);
  readonly poolSelected = output<string>();

  readonly pools = toSignal(
    this.leagueService.getLeagueInfo().pipe(
      map((info) => info.pools ?? []),
      catchError(() => of([])),
    ),
    { initialValue: [] },
  );

  selectPool(poolSlug: string): void {
    if (poolSlug === this.currentPoolSlug()) return;
    this.poolSelected.emit(poolSlug);
  }
}
