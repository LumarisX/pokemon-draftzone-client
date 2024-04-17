import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SpeedChart, Speedtier, Summary } from '../../matchup-interface';
import { SpriteComponent } from '../../../images/sprite.component';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../../../interfaces/draft';
import { SpeedModifierIconComponent } from './speed-modifier-icon.component';

@Component({
  selector: 'speedchart',
  standalone: true,
  templateUrl: './speedchart.component.html',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    SpeedModifierIconComponent,
  ],
})
export class SpeedchartComponent implements OnInit {
  @Input() speedchart!: SpeedChart | null;
  private _speeds: {
    pokemon: Pokemon & {
      name: string;
      abilities: string[];
      types: string[];
      baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
      };
    };
    team: number;
  }[] = [];
  @Input() set speeds(summaries: Summary[]) {
    let c0 = 0;
    let c1 = 0;
    for (
      let i = 0;
      i < summaries[0].team.length + summaries[1].team.length;
      i++
    ) {
      if (
        c1 >= summaries[1].team.length ||
        summaries[0].team[c0].baseStats.spe >
          summaries[1].team[c1].baseStats.spe
      ) {
        this._speeds.push({ pokemon: summaries[0].team[c0], team: 0 });
        c0++;
      } else {
        this._speeds.push({ pokemon: summaries[1].team[c1], team: 1 });
        c1++;
      }
    }
  }

  get speeds(): {
    pokemon: Pokemon & {
      name: string;
      abilities: string[];
      types: string[];
      baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
      };
    };
    team: number;
  }[] {
    return this._speeds;
  }

  @Input() level = 100;
  showFilter: boolean = false;

  modifiers: [
    {
      [key: string]: boolean;
    },
    {
      [key: string]: boolean;
    }
  ] = [{}, {}];

  enabledMons: [aTeam: string | null, bTeam: string | null] = [null, null];

  constructor() {}

  ngOnInit() {
    this.resetModifiers();
  }

  resetModifiers() {
    for (let team in this.modifiers) {
      this.modifiers[team] = {
        '252': true,
        Positive: true,
        '0': true,
        Negative: true,
        'Swift Swim': true,
        'Sand Rush': true,
        Chlorophyll: true,
        'Slush Rush': true,
        Protosynthesis: true,
        'Quark Drive': true,
        'Quick Feet': true,
        Unburden: true,
        'Surge Surfer': true,
      };
    }
  }

  teamColor(team: number) {
    let classes = [];
    if (team == 0) classes.push('bg-cyan-400');
    else classes.push('bg-red-400');
    return classes;
  }

  toggleView(s: {
    pokemon: Pokemon & {
      name: string;
      abilities: string[];
      types: string[];
      baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
      };
    };
    team: number;
  }) {
    if (this.enabledMons[s.team] == s.pokemon.pid) {
      this.enabledMons[s.team] = null;
    } else {
      this.enabledMons[s.team] = s.pokemon.pid;
    }
  }

  viewColor(s: {
    pokemon: Pokemon & {
      name: string;
      abilities: string[];
      types: string[];
      baseStats: {
        hp: number;
        atk: number;
        def: number;
        spa: number;
        spd: number;
        spe: number;
      };
    };
    team: number;
  }) {
    if (
      this.enabledMons[s.team] &&
      s.pokemon.pid !== this.enabledMons[s.team]
    ) {
      return ['opacity-50'];
    }
    return [];
  }

  buttonColor(team: number) {
    let classes = [];
    if (team == 0) {
      classes.push('bg-cyan-400 hover:bg-cyan-300');
    } else {
      classes.push('bg-red-400 hover:bg-red-300');
    }
    return classes;
  }

  sortTiers(a: Speedtier, b: Speedtier): number {
    if (a.speed > b.speed) return -1;
    if (a.speed < b.speed) return 1;
    return 0;
  }

  filtered(tier: Speedtier) {
    if (
      this.enabledMons[tier.team] &&
      tier.pokemon.pid !== this.enabledMons[tier.team]
    ) {
      return false;
    }
    for (let mod of tier.modifiers) {
      if (mod in this.modifiers[tier.team]) {
        if (!this.modifiers[tier.team][mod]) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
}
