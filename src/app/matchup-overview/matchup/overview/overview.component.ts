import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatchupService } from '../../../api/matchup.service';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { Summery } from '../../matchup-interface';

@Component({
  selector: 'overview',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  @Input() teams: Summery[] = [];
  sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' = 'spe';

  constructor(private matchupService: MatchupService) {}

  sortByStat(
    data: Summery,
    sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe'
  ): Summery {
    data.team.sort((x, y) => {
      if (x['baseStats'][sortStat] < y['baseStats'][sortStat]) {
        return 1;
      }
      if (x['baseStats'][sortStat] > y['baseStats'][sortStat]) {
        return -1;
      }
      return 0;
    });
    return data;
  }
}
