import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  Sort,
  SortDirective,
} from '@pdz/shared/data/sort/sort.directive';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DRAFT_OVERVIEW_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { BehaviorSubject } from 'rxjs';
import { DraftService, PokemonStat } from '../draft.service';

@Component({
  selector: 'pdz-draft-stats',
  templateUrl: './draft-stats.component.html',
  styleUrl: './draft-stats.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    CdkTableModule,
    SortDirective,
    SortHeaderComponent,
    ButtonComponent,
  ],
})
export class DraftStatsComponent implements OnInit {
  private draftService = inject(DraftService);
  private route = inject(ActivatedRoute);

  readonly draftPath = DRAFT_OVERVIEW_PATH;
  teamStats = new BehaviorSubject<PokemonStat[]>([]);
  displayedColumns: string[] = [
    'sprite',
    'name',
    'gb',
    'dk',
    'ik',
    'deaths',
    'kdr',
    'kpg',
  ];

  ngOnInit(): void {
    const teamId = this.route.snapshot.paramMap.get('teamId') || '';
    const archived = this.route.snapshot.data['archived'] === true;
    const stats$ = archived
      ? this.draftService.getArchiveStats(teamId)
      : this.draftService.getStats(teamId);
    stats$.subscribe((data) => {
      this.teamStats.next(data.pokemon);
    });
  }

  sort(sort: Sort) {
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
    this.teamStats.next(
      this.teamStats.value.sort((a, b) => {
        switch (sort.active) {
          case 'name':
            return compare(a.pokemon.name, b.pokemon.name);
          case 'gb':
            return compare(a.brought, b.brought);
          case 'dk':
            return compare(a.kills, b.kills);
          case 'ik':
            return compare(a.indirect, b.indirect);
          case 'deaths':
            return compare(a.deaths, b.deaths);
          case 'kdr':
            return compare(a.kdr, b.kdr);
          case 'kpg':
            return compare(a.kpg, b.kpg);
          default:
            return 0;
        }
      }),
    );
  }
}
