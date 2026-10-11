import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { safeStorage } from '@pdz/core/utils/storage';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import { PlannerMoveCoverageComponent } from '@pdz/features/planner/coverage/move-coverage.component';
import { PlannerTeamCoverageComponent } from '@pdz/features/planner/coverage/team-coverage.component';
import { MoveComponent } from '@pdz/features/planner/moves/moves.component';
import { PlannerSummaryComponent } from '@pdz/features/planner/summary/summary.component';
import { PlannerTypechartComponent } from '@pdz/features/planner/typechart/typechart.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { Sort, SortDirective } from '@pdz/shared/data/sort/sort.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { Subject, catchError, debounceTime, of } from 'rxjs';

type Scores = Record<string, number>;

const STORAGE_KEY = 'league-power-rankings';
const SAVE_DEBOUNCE_MS = 1000;

@Component({
  selector: 'pdz-league-power-rankings',
  imports: [
    CardComponent,
    FieldComponent,
    InputDirective,
    LoadingComponent,
    MoveComponent,
    PageHeaderComponent,
    PlannerMoveCoverageComponent,
    PlannerSummaryComponent,
    PlannerTeamCoverageComponent,
    PlannerTypechartComponent,
    PokemonComponent,
    SelectComponent,
    SelectOptionComponent,
    SortDirective,
    SortHeaderComponent,
    SpriteComponent,
  ],
  templateUrl: './power-rankings.component.html',
  styleUrl: './power-rankings.component.scss',
})
export class PowerRankingsComponent {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly save$ = new Subject<Scores>();

  readonly teams = toSignal(
    this.leagueService
      .powerRankingDetails()
      .pipe(catchError(() => of<League.PowerRankingTeam[]>([]))),
  );

  readonly scores = signal<Scores>(safeStorage.getJson<Scores>(STORAGE_KEY) ?? {});
  readonly sortDescending = signal(true);

  readonly selectedId = linkedSignal(() => this.teams()?.[0]?.info.id ?? null);

  readonly selectedTeam = computed(() => {
    const id = this.selectedId();
    return this.teams()?.find((team) => team.info.id === id) ?? null;
  });

  readonly ranked = computed(() => {
    const direction = this.sortDescending() ? -1 : 1;
    return [...(this.teams() ?? [])].sort((a, b) => {
      const left = this.scoreFor(a);
      const right = this.scoreFor(b);
      if (left === undefined) return 1;
      if (right === undefined) return -1;
      return (left - right) * direction;
    });
  });

  constructor() {
    this.save$
      .pipe(debounceTime(SAVE_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe((scores) => safeStorage.setJson(STORAGE_KEY, scores));

    effect(() => this.save$.next(this.scores()));
  }

  scoreFor(team: League.PowerRankingTeam): number | undefined {
    return this.scores()[team.info.id] ?? team.score;
  }

  setScore(value: string): void {
    const team = this.selectedTeam();
    if (!team) return;
    const parsed = Number(value);
    this.scores.update((scores) => {
      const next = { ...scores };
      if (value === '' || !Number.isFinite(parsed)) delete next[team.info.id];
      else next[team.info.id] = parsed;
      return next;
    });
  }

  onSort(sort: Sort): void {
    this.sortDescending.set(sort.direction !== 'asc');
  }
}
