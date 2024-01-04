import { CommonModule } from '@angular/common';
import { Component, Input, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteService } from '../../sprite/sprite.service';
import { Typechart, Types } from '../matchup-interface';
import { SpriteComponent } from "../../sprite/sprite.component";

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent]
})
export class TypechartComponent {

  @Input() matchupId!: string;
  teams!: Typechart[];
  selectedTeam: number = 1;
  types: (keyof Types)[] = ["Normal", "Grass", "Water", "Fire", "Electric", "Ground", "Rock", "Flying", "Ice", "Fighting", "Poison", "Bug", "Psychic", "Dark", "Ghost", "Dragon", "Steel", "Fairy"];

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getTypechart(this.matchupId).subscribe((data) => {
      this.teams = <Typechart[]>data;
    });
  }

  swapTeams() {
    this.selectedTeam = (this.selectedTeam + 1) % this.teams.length;
  }

  typeColor(weak: number): string {
    if (weak > 4)
      return "bg-rose-600";
    if (weak > 2)
      return "bg-rose-500";
    if (weak > 1)
      return "bg-rose-400";
    if (weak < .25)
      return "bg-emerald-600";
    if (weak < .5)
      return "bg-emerald-500";
    if (weak < 1)
      return "bg-emerald-400";
    return "text-transparent"
  }

  weakColor(weak: number): string {
    if (weak > 5)
      return "bg-rose-600";
    if (weak > 4)
      return "bg-rose-500";
    if (weak > 3)
      return "bg-rose-400";
    if (weak < 1)
      return "bg-emerald-600";
    if (weak < 2)
      return "bg-emerald-500";
    if (weak < 3)
      return "bg-emerald-400";
    return ""
  }

  resistColor(weak: number): string {
    if (weak > 4)
      return "bg-emerald-600";
    if (weak > 3)
      return "bg-emerald-500";
    if (weak > 2)
      return "bg-emerald-400";
    if (weak < 1)
      return "bg-rose-500"
    if (weak < 2)
      return "bg-rose-400";
    return ""
  }

  diffColor(weak: number): string {
    if (weak > 3)
      return "bg-emerald-700";
    if (weak > 2)
      return "bg-emerald-600";
    if (weak > 1)
      return "bg-emerald-500";
    if (weak > 0)
      return "bg-emerald-400";
    if (weak < -2)
      return "bg-rose-600";
    if (weak < -1)
      return "bg-rose-500";
    if (weak < 0)
      return "bg-rose-400";
    return ""
  }

  teamColor(inverted: boolean = false) {
    if ((this.selectedTeam > 0) == inverted)
      return "bg-cyan-400"
    return "bg-red-400"
  }
}
