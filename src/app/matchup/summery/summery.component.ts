import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteComponent } from "../../sprite/sprite.component";
import { SpriteService } from '../../sprite/sprite.service';
import { Summery } from '../matchup-interface';

@Component({
  selector: 'summery',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './summery.component.html'
})
export class SummeryComponent implements OnInit {

  @Input() teamId!: string;
  @Input() oppId!: string;
  teams: Summery[][] = [];
  sortStat: "hp" | "atk" | "def" | "spa" | "spd" | "spe" = "spe"
  selectedTeam: number = 0;

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    this.serverServices.getSummery(this.teamId, this.oppId).subscribe((data) => {
      this.teams = <Summery[][]>data;
      for(let team in this.teams){
        this.sortByStat(this.teams[team], this.sortStat)
      }
    });
  }

  sortByStat(data: Summery[], sortStat: "hp" | "atk" | "def" | "spa" | "spd" | "spe"): Summery[] {
    data.sort((x, y) => {
      if (x["baseStats"][sortStat] < y["baseStats"][sortStat]) {
        return (1);
      }
      if (x["baseStats"][sortStat] > y["baseStats"][sortStat]) {
        return (-1);
      }
      return (0);
    });
    return data;
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


