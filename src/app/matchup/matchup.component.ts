import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ServerService } from '../api/server.service';
import { SpriteService } from '../sprite/sprite.service';
import { Draft } from '../draft';
import { SpeedchartComponent } from './speedchart/speedchart.component';
import { SummeryComponent } from './summery/summery.component';
import { TypechartComponent } from './typechart/typechart.component';
import { MovechartComponent } from './movechart/movechart.component';
import { coveragechartComponent } from "./coveragechart/coveragechart.component";

@Component({
    selector: 'matchup',
    standalone: true,
    template: `
    <a routerLink="/drafts/{{draft.leagueId}}">Back</a>
    <div class="flex flex-wrap">
      <summery [teamId]="this.draft._id" [oppId]="this.oppId"></summery>
      <typechart [teamId]="this.draft._id" [oppId]="this.oppId"></typechart>
      <speedchart [teamId]="this.draft._id" [oppId]="this.oppId"></speedchart>
      <movechart [teamId]="this.draft._id" [oppId]="this.oppId"></movechart>
      <coveragechart [teamId]="this.draft._id" [oppId]="this.oppId"></coveragechart>
    </div>
  `,
    imports: [CommonModule, RouterModule, SummeryComponent, TypechartComponent, MovechartComponent, SpeedchartComponent, coveragechartComponent]
})
export class MatchupComponent implements OnInit {

  draft!: Draft;
  oppId!: string;

  constructor(private spriteService: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    let teamName = <string>this.route.snapshot.paramMap.get("teamid");
    this.oppId = <string>this.route.snapshot.paramMap.get("matchid");
    this.serverServices.getDraft(teamName).subscribe((data) => {
      this.draft = <Draft>data;
    });

  }
}
