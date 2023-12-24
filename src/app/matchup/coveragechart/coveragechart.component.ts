import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { Coveragechart } from '../matchup-interface';
import { SpriteComponent } from '../../sprite/sprite.component';

@Component({
  selector: 'coveragechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './coveragechart.component.html'
})
export class coveragechartComponent implements OnInit {

  @Input() teamId!: string;
  @Input() oppId!: string;
  teams!: Coveragechart[][];
  selectedTeam: number = 0;

  constructor(private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getCoveragechart(this.teamId, this.oppId).subscribe((data) => {
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
