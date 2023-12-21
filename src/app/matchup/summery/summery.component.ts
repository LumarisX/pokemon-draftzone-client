import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteComponent } from "../../sprite/sprite.component";
import { SpriteService } from '../../sprite/sprite.service';
import { SummeryChart } from '../matchup-interface';

@Component({
    selector: 'summery',
    standalone: true,
    imports: [CommonModule, SpriteComponent],
    templateUrl: './summery.component.html'
})
export class SummeryComponent implements OnInit{

  @Input() teamId!: string;
  @Input() oppId!: string;
  summery!: SummeryChart;

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    this.serverServices.getSummery(this.teamId, this.oppId).subscribe((data) => {
      this.summery = <SummeryChart>data;
    });
  }
}
