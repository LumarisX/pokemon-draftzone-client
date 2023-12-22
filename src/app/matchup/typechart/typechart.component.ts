import { CommonModule } from '@angular/common';
import { Component, Input, Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ServerService } from '../../api/server.service';
import { SpriteService } from '../../sprite/sprite.service';
import { Typechart } from '../matchup-interface';
import { SpriteComponent } from "../../sprite/sprite.component";

@Component({
  selector: 'typechart',
  standalone: true,
  templateUrl: './typechart.component.html',
  imports: [CommonModule, SpriteComponent]
})
export class TypechartComponent {

  @Input() teamId!: string;
  @Input() oppId!: string;
  aTeam!: Typechart[];
  bTeam!: Typechart[]
  types: (keyof Typechart["weak"])[] = ["Normal", "Grass", "Water", "Fire", "Electric", "Ground", "Rock", "Flying", "Ice", "Fighting", "Poison", "Bug", "Psychic", "Dark", "Ghost", "Dragon", "Steel", "Fairy"];

  constructor(private spriteServices: SpriteService, private serverServices: ServerService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.serverServices.getTypechart(this.teamId, this.oppId).subscribe((data) => {
      [this.aTeam, this.bTeam] = <Typechart[][]>data;
    });
  }

  weakColor(weak: number): string {
    if (weak > 4) {
      return "bg-rose-600";
    }
    if (weak > 2) {
      return "bg-rose-500";
    }
    if (weak > 1) {
      return "bg-rose-400";
    }
    if (weak < .25) {
      return "bg-emerald-600";
    }
    if (weak < .5) {
      return "bg-emerald-500";
    }
    if (weak < 1) {
      return "bg-emerald-400";
    }
    return ""
  }
}
