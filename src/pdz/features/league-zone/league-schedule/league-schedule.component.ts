import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import {
  Subject,
  catchError,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { LeagueBracketCanvasComponent } from '../league-bracket/league-bracket-canvas/league-bracket-canvas.component';
import { LeagueScheduleWidgetComponent } from '../league-widgets/league-schedule-widget/league-schedule-widget.component';
import { BracketWithSeeding, LeagueZoneService } from '../league-zone.service';

@Component({
  selector: 'pdz-league-schedule',
  imports: [
    LoadingComponent,
    LeagueBracketCanvasComponent,
    LeagueScheduleWidgetComponent,
  ],
  templateUrl: './league-schedule.component.html',
  styleUrls: ['./league-schedule.component.scss'],
})
export class LeagueScheduleComponent implements OnInit, OnDestroy {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  isLoading = true;
  bracket: BracketWithSeeding | null = null;

  get hasBracket(): boolean {
    return (this.bracket?.matches?.length ?? 0) > 0;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('stageSlug')),
        distinctUntilChanged(),
        switchMap((stageSlug) => {
          this.isLoading = true;
          this.bracket = null;
          return this.leagueService
            .getStageBracket(stageSlug ?? '')
            .pipe(catchError(() => of(null)));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((bracket) => {
        this.bracket = bracket;
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
