import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Movechart } from '../../matchup-interface';
import { MatchupService } from '../../../api/matchup.service';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { SpriteService } from '../../../sprite/sprite.service';

@Component({
  selector: 'movechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './movechart.component.html',
})
export class MovechartComponent {
  @Input() matchupId!: string;
  teams!: Movechart[];
  selectedTeam: number = 1;

  constructor(
    private spriteServices: SpriteService,
    private matchupService: MatchupService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.matchupService.getMovechart(this.matchupId).subscribe((data) => {
      this.teams = <Movechart[]>data;
      console.log(this.teams);
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
