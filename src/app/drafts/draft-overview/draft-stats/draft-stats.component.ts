import { Component, OnInit, inject } from '@angular/core';
import { DraftService } from '../../../services/draft.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpriteComponent } from '../../../images/sprite/sprite.component';
import { LoadingComponent } from '../../../images/loading/loading.component';
import { DraftOverviewPath } from '../draft-overview-routing.module';
import { Pokemon } from '../../../interfaces/draft';
import { MatSortModule, Sort } from '@angular/material/sort';
import { CdkTableModule } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

export type Stats = {
  pokemon: Pokemon;
  kills: number;
  indirect: number;
  brought: number;
  deaths: number;
  kdr: number;
  kpg: number;
};

@Component({
  selector: 'draft-stats',
  standalone: true,
  templateUrl: './draft-stats.component.html',
  styleUrl: './draft-stats.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    SpriteComponent,
    LoadingComponent,
    CdkTableModule,
    MatSortModule,
    MatButtonModule,
  ],
})
export class DraftStatsComponent implements OnInit {
  private draftService = inject(DraftService);
  private route = inject(ActivatedRoute);

  readonly draftPath = DraftOverviewPath;
  teamStats = new BehaviorSubject<Stats[]>([]);
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
    this.draftService.getStats(teamId).subscribe((data) => {
      this.teamStats.next(data);
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
