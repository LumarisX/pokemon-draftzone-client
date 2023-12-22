import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteService } from '../../sprite/sprite.service';
import { Summery } from '../matchup-interface';

@Component({
  selector: 'movechart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movechart.component.html'
})
export class MovechartComponent {

  @Input() teamId!: string;
  @Input() oppId!: string;
  aTeam!: Summery[];
  bTeam!: Summery[];

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getSummery(this.teamId, this.oppId).subscribe((data) => {
      [this.aTeam, this.bTeam] = <Summery[][]>data;
    });
  }
}
