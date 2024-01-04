import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteService } from '../../sprite/sprite.service';
import { SpriteComponent } from '../../sprite/sprite.component';
import { Movechart } from '../matchup-interface';

@Component({
  selector: 'movechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './movechart.component.html'
})
export class MovechartComponent {

  @Input() matchupId!: string;
  teams!: Movechart[];
  selectedTeam: number = 1;

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getMovechart(this.matchupId).subscribe((data) => {
      this.teams = <Movechart[]>data;
      console.log(this.teams)
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
