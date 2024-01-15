import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatchupService } from '../../api/matchup.service';
import { SpriteComponent } from '../../sprite/sprite.component';
import { Coveragechart } from '../matchup-interface';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coveragechart.component.html'
})
export class CoveragechartComponent implements OnInit {

  @Input() matchupId!: string;

  teams!: Coveragechart[][];
  selectedTeam: number = 0;

  constructor(private matchupService: MatchupService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.matchupService.getCoveragechart(this.matchupId).subscribe((data) => {
      this.teams = <Coveragechart[][]>data;
    });

  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if ((this.selectedTeam > 0) == inverted)
      return "bg-cyan-400"
    return "bg-red-400"
  }

}
