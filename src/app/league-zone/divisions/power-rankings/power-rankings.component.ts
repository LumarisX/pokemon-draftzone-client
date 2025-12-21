
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { PlannerCoverageComponent } from '../../../planner/coverage/coverage.component';
import { MoveComponent } from '../../../planner/moves/moves.component';
import { PlannerSummaryComponent } from '../../../planner/summary/summary.component';
import { PlannerTypechartComponent } from '../../../planner/typechart/typechart.component';
import {
  LeagueZoneService,
  PowerRankingTeam,
} from '../../../services/leagues/league-zone.service';
import { CdkTableModule } from '@angular/cdk/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'pdz-league-power-rankings',
  imports: [
    LoadingComponent,
    PlannerSummaryComponent,
    MatIconModule,
    PlannerTypechartComponent,
    MoveComponent,
    PlannerCoverageComponent,
    CdkTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    MatSortModule,
    SpriteComponent
],
  templateUrl: './power-rankings.component.html',
  styleUrl: './power-rankings.component.scss',
})
export class PowerRankingsComponent implements OnInit, OnDestroy {
  leagueService = inject(LeagueZoneService);

  private scoreUpdate$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  private readonly storageKey = 'league-power-rankings';

  selectedTeam?: PowerRankingTeam;
  teams?: PowerRankingTeam[];
  isDropdownOpen: boolean = false;
  displayedColumns: string[] = ['position', 'teamName', 'draft', 'score'];
  ngOnInit() {
    this.leagueService.powerRankingDetails().subscribe((data) => {
      const savedScores = this.getSavedScores();
      this.teams = data.map((team) => {
        if (savedScores[team.info.id]) {
          team.score = savedScores[team.info.id];
        }
        return team;
      });
      this.selectedTeam = this.teams[0];
    });

    this.scoreUpdate$
      .pipe(debounceTime(3000), takeUntil(this.destroy$))
      .subscribe(() => this.saveScores());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onScoreChange(score: number) {
    if (this.selectedTeam) {
      this.selectedTeam.score = score;
      this.scoreUpdate$.next();
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTeamAndClose(team: PowerRankingTeam) {
    this.selectedTeam = team;
    this.isDropdownOpen = false;
  }

  private getSavedScores(): { [id: string]: number } {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {};
  }

  private saveScores() {
    if (!this.teams) return;
    const scoresToSave = this.teams.reduce(
      (acc, team) => {
        if (team.score !== undefined) acc[team.info.id] = team.score;
        return acc;
      },
      {} as { [id: string]: number },
    );
    localStorage.setItem(this.storageKey, JSON.stringify(scoresToSave));
  }

  sort(sort: Sort) {
    if (!this.teams) return;
    const isAsc = sort.direction === 'asc';
    const compare = (
      a: number | string | null | undefined,
      b: number | string | null | undefined,
    ) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b) * (isAsc ? 1 : -1)
        : (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    };
    this.teams = [...this.teams].sort((a, b) => {
      switch (sort.active) {
        case 'score':
          return compare(a.score, b.score);
        default:
          return 0;
      }
    });
  }
}
