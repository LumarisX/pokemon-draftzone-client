import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { Speedtier } from '../matchup-interface';

@Component({
  selector: 'speedchart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speedchart.component.html'
})
export class SpeedchartComponent implements OnInit {

  @Input() teamId!: string;
  @Input() oppId!: string;
  speedchart!: Speedtier[];

  constructor(private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getSpeedchart(this.teamId, this.oppId).subscribe((data) => {
      let [a, b] = <Speedtier[][]>data;
      this.speedchart = this.sortTiers(a,b)
    });
    //document.getElementById("base").scrollIntoView()
  }

  sortTiers(a:Speedtier[], b:Speedtier[]): Speedtier[] {
    let out = []
    let ai = 0;
    let bi = 0;
    for (let i = 0; i < (a.length + b.length); i++) {
      if(ai<a.length && (bi>=b.length || a[ai].speed>b[bi].speed)){
        a[ai]["team"] = "cyan";
        out.push(a[ai++])
      } else {
        b[bi]["team"] = "red";
        out.push(b[bi++])
      }
    }
    return out
  }
}
