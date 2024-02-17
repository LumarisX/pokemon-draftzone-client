import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatchupService } from '../../../api/matchup.service';
import { SpriteComponent } from '../../../sprite/sprite.component';
import { MoveChart } from '../../matchup-interface';

@Component({
  selector: 'movechart',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './movechart.component.html',
})
export class MovechartComponent {
  @Input() matchupId!: string;
  teams!: MoveChart[];
  selectedTeam: number = 1;

  constructor(private matchupService: MatchupService) {}

  ngOnInit() {
    this.matchupService.getMovechart(this.matchupId).subscribe((data) => {
      this.teams = <MoveChart[]>data;
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
