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
export class OverviewComponent implements OnInit {
  @Input() matchupId!: string;
  aTeam!: Summery;
  bTeam!: Summery;
  sortStat: 'hp' | 'atk' | 'def' | 'spa' | 'spd' | 'spe' = 'spe';

  constructor(private matchupService: MatchupService) {}

  ngOnInit() {
    this.matchupService.getSummery(this.matchupId).subscribe((data) => {
      [this.aTeam, this.bTeam] = <Summery[]>data;
      console.log(data);
      this.aTeam = this.sortByStat(this.aTeam, this.sortStat);
      this.bTeam = this.sortByStat(this.bTeam, this.sortStat);
    });
  }

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
