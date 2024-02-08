import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Coverage } from '../../matchup-interface';
import { CoverageComponent } from './coverage/coverage.component';
import { MatchupService } from '../../../api/matchup.service';
import { SpriteComponent } from '../../../sprite/sprite.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, CoverageComponent, SpriteComponent],
  templateUrl: './coveragechart.component.html',
})
export class CoveragechartComponent implements OnInit {
  @Input() matchupId!: string;

  teams!: Coverage[][];
  selectedTeam: number = 0;

  constructor(
    private matchupService: MatchupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.matchupService.getCoveragechart(this.matchupId).subscribe((data) => {
      this.teams = <Coverage[][]>data;
    });
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if (this.selectedTeam > 0 == inverted) return 'bg-cyan-400';
    return 'bg-red-400';
  }
}
