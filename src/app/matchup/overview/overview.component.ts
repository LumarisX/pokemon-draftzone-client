import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteComponent } from "../../sprite/sprite.component";
import { SpriteService } from '../../sprite/sprite.service';
import { Summery } from '../matchup-interface';

@Component({
  selector: 'overview',
  standalone: true,
  imports: [CommonModule, SpriteComponent],
  templateUrl: './overview.component.html'
})
export class OverviewComponent implements OnInit {

  @Input() teamId!: string;
  @Input() oppId!: string;
  aTeam!: Summery[];
  bTeam!: Summery[]
  sortStat: "hp" | "atk" | "def" | "spa" | "spd" | "spe" = "spe"

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }


  ngOnInit() {
    this.serverServices.getSummery(this.teamId, this.oppId).subscribe((data) => {
      [this.aTeam, this.bTeam] = <Summery[][]>data;
      this.aTeam = this.sortByStat(this.aTeam, this.sortStat)
      this.bTeam = this.sortByStat(this.bTeam, this.sortStat)
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
}


