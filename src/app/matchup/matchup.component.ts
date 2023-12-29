import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServerService } from '../api/server.service';
import { Draft } from '../draft';
import { SpriteComponent } from '../sprite/sprite.component';
import { CoveragechartComponent } from "./coveragechart/coveragechart.component";
import { MovechartComponent } from './movechart/movechart.component';
import { OverviewComponent } from './overview/overview.component';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummeryComponent } from './summery/summery.component';
import { TypechartComponent } from './typechart/typechart.component';

@Component({
  selector: 'matchup',
  standalone: true,
  templateUrl: "./matchup.component.html",
  imports: [CommonModule, RouterModule, SummeryComponent, SpriteComponent, TypechartComponent, MovechartComponent, SpeedchartComponent, CoveragechartComponent, OverviewComponent]
})
export class MatchupComponent implements OnInit {

  draft!: Draft;
  oppId!: string;

  constructor(private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    let teamName = <string>this.route.snapshot.paramMap.get("teamid");
    this.oppId = <string>this.route.snapshot.paramMap.get("matchid");
    this.serverServices.getDraft(teamName).subscribe((data) => {
      this.draft = <Draft>data;
    });

  }
}
