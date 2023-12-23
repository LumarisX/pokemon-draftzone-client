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

  constructor(private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getCoveragechart(this.teamId, this.oppId).subscribe((data) => {
      this.teams = <Coveragechart[][]>data;
    });

  }

}
