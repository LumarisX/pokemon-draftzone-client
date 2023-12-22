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
      this.speedchart = this.sortTiers(a, b)
      this.makeSticky(this.speedchart)
      this.setBase(this.speedchart)
    });
    document.getElementById("base")!.scrollIntoView()
  }

  speedClasses(tier: Speedtier | null) {
    let classes = []
    if (tier!= undefined && tier.stick) {
      classes.push("sticky")
    }
    if (tier!= undefined && tier.base) {
      classes.push("base")
    }
    return classes
  }

  sortTiers(a: Speedtier[], b: Speedtier[]): Speedtier[] {
    let out = []
    let ai = 0;
    let bi = 0;
    for (let i = 0; i < (a.length + b.length); i++) {
      if (ai < a.length && (bi >= b.length || a[ai].speed > b[bi].speed)) {
        a[ai]["team"] = "cyan";
        out.push(a[ai++])
      } else {
        b[bi]["team"] = "red";
        out.push(b[bi++])
      }
    }
    return out
  }

  makeSticky(speedchart: Speedtier[]) {
    for (let i = 0; i < speedchart.length - 1; i++) {
      if (speedchart[i].team != speedchart[i + 1].team) {
        speedchart[i].stick = true;
      }
    }
  }
  
  setBase(speedchart:Speedtier[]){
    let slowest: Speedtier | null = null;
    for (let tier of speedchart) {
      if (tier.modifiers.length==1 && tier.modifiers[0]=="max+"){
        if(slowest==null || slowest.speed>tier.speed){
          slowest = tier;
        }
      }
    }
    if(slowest!=null){
    slowest.base=true
    }
  }
}
