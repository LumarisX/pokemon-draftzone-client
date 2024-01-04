import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteComponent } from "../../sprite/sprite.component";
import { SpriteService } from '../../sprite/sprite.service';
import { Summery } from '../matchup-interface';

@Component({
  selector: 'summery',
  standalone: true,
  imports: [CommonModule, FormsModule, SpriteComponent],
  templateUrl: './summery.component.html'
})
export class SummeryComponent implements OnInit {

  @Input() matchupId!: string;
  teams: Summery[] = [];
  sortBy: "name" | "hp" | "atk" | "def" | "spa" | "spd" | "spe" | null = null
  selectedTeam: number = 1;
  reversed: boolean = false;
  baseValue: number = 80

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    this.serverServices.getSummery(this.matchupId).subscribe((data) => {
      this.teams = <Summery[]>data;
      this.sortByStat("spe")
    });
  }

  sortByStat(sortStat: "hp" | "atk" | "def" | "spa" | "spd" | "spe") {
    if (sortStat != this.sortBy) {
      this.sortBy = sortStat;
      this.reversed = false;
      for (let team of this.teams) {
        team.team.sort((x, y) => {
          if (x["baseStats"][sortStat] < y["baseStats"][sortStat]) {
            return (1);
          }
          if (x["baseStats"][sortStat] > y["baseStats"][sortStat]) {
            return (-1);
          }
          return (0);
        });
      }
    } else {
      for (let team of this.teams) {
        team.team.reverse()
      }
      this.reversed = !this.reversed
    }
  }

  sortByName() {
    if ("name" != this.sortBy) {
      this.sortBy = "name";
      this.reversed = true;
      for (let team of this.teams) {
        team.team.sort((x, y) => {
          if (x["name"] > y["name"]) {
            return (1);
          }
          if (x["name"] < y["name"]) {
            return (-1);
          }
          return (0);
        });
      }
    } else {
      for (let team of this.teams) {
        team.team.reverse()
      }
      this.reversed = !this.reversed
    }
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  teamColor(inverted: boolean = false) {
    if ((this.selectedTeam > 0) == inverted)
      return "bg-cyan-400"
    return "bg-red-400"
  }

  statColor(statValue: number) {
    if (statValue > this.baseValue + 67)
      return "bg-emerald-600"
    if (statValue > this.baseValue + 52)
      return "bg-emerald-500"
    if (statValue > this.baseValue + 37)
      return "bg-emerald-400"
    if (statValue > this.baseValue + 22)
      return "bg-emerald-300"
    if (statValue > this.baseValue + 7)
      return "bg-emerald-200"
    if (statValue < this.baseValue + 8 && statValue > this.baseValue - 8)
      return "bg-slate-200"
    if (statValue < this.baseValue - 67)
      return "bg-rose-600"
    if (statValue < this.baseValue - 52)
      return "bg-rose-500"
    if (statValue < this.baseValue - 37)
      return "bg-rose-400"
    if (statValue < this.baseValue - 22)
      return "bg-rose-300"
    if (statValue < this.baseValue - 7)
      return "bg-rose-200"
    return
  }
}


