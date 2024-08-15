import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SpeedChart, Speedtier, Summary } from '../../matchup-interface';
import { SpriteComponent } from '../../../images/sprite.component';
import { FormsModule } from '@angular/forms';
import { Pokemon } from '../../../interfaces/draft';
import { SpeedModifierIconComponent } from './speed-modifier-icon.component';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CloseSVG } from '../../../images/svg-components/close.component';
import { FilterSVG } from '../../../images/svg-components/filter.component';

@Component({
  selector: 'speedchart',
  standalone: true,
  templateUrl: './speedchart.component.html',
  imports: [
    CommonModule,
    FormsModule,
    SpriteComponent,
    CloseSVG,
    FilterSVG,
    SpeedModifierIconComponent,
  ],
  animations: [
    trigger('growIn', [
      state('void', style({ height: '0', overflow: 'hidden' })),
      state('*', style({ height: '*' })),
      transition('void <=> *', [animate('0.5s ease-in-out')]),
    ]),
  ],
})
export class SpeedchartComponent implements OnInit {
  @Input() speedchart!: SpeedChart | null;
  private _speeds: {
    pokemon: Pokemon & {
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
    this._speeds = [];
    let combined: {
      pokemon: Pokemon & {
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
    summaries[0].team.forEach((pokemon) => {
      combined.push({ pokemon: pokemon, team: 0 });
    });
    summaries[1].team.forEach((pokemon) => {
      combined.push({ pokemon: pokemon, team: 1 });
    });
    combined.sort((a, b) => b.pokemon.baseStats.spe - a.pokemon.baseStats.spe);
    this._speeds = combined;
  }

  get speeds(): {
    pokemon: Pokemon & {
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
    if (team == 0) classes.push('bg-aTeam-300');
    else classes.push('bg-bTeam-300');
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
    if (this.enabledMons[s.team] == s.pokemon.id) {
      this.enabledMons[s.team] = null;
    } else {
      this.enabledMons[s.team] = s.pokemon.id;
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
    if (this.enabledMons[s.team] && s.pokemon.id !== this.enabledMons[s.team]) {
      return ['opacity-50'];
    }
    return [];
  }

  buttonColor(team: number) {
    let classes = [];
    if (team == 0) {
      classes.push('bg-aTeam-300 hover:bg-aTeam-300');
    } else {
      classes.push('bg-bTeam-300 hover:bg-bTeam-300');
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
      tier.pokemon.id !== this.enabledMons[tier.team]
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
