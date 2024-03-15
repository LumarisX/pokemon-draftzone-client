import { Component, OnInit } from '@angular/core';
import { DraftService } from '../../api/draft.service';
import { ActivatedRoute } from '@angular/router';
import { Stats } from './draft-stats.interface';
import { CommonModule } from '@angular/common';
import { SpriteComponent } from '../../sprite/sprite.component';

@Component({
  selector: 'draft-stats',
  standalone: true,
  templateUrl: './draft-stats.component.html',
  imports: [CommonModule, SpriteComponent],
})
export class DraftStatsComponent implements OnInit {
  constructor(
    private draftService: DraftService,
    private route: ActivatedRoute
  ) {}

  teamId: string = '';
  teamStats!: Stats[];
  sortBy:
    | 'name'
    | 'kills'
    | 'deaths'
    | 'brought'
    | 'indirect'
    | 'kdr'
    | 'kpg'
    | null = null;
  reversed = false;

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('teamId') || '';
    this.draftService.getStats(this.teamId).subscribe((data) => {
      this.teamStats = <Stats[]>data;
    });
  }

  sortByStat(
    sortStat:
      | 'name'
      | 'kills'
      | 'deaths'
      | 'brought'
      | 'indirect'
      | 'kdr'
      | 'kpg'
  ) {
    if (sortStat != this.sortBy) {
      this.sortBy = sortStat;
      this.reversed = false;
      this.teamStats.sort((x, y) => {
        if (sortStat != 'name') {
          if (x[sortStat] < y[sortStat]) {
            return 1;
          }
          if (x[sortStat] > y[sortStat]) {
            return -1;
          }
        }
        if (x.pokemon.name > y.pokemon.name) {
          return 1;
        }
        if (x.pokemon.name < y.pokemon.name) {
          return -1;
        }
        return 0;
      });
    } else {
      this.teamStats.reverse();
      this.reversed = !this.reversed;
    }
  }
}
