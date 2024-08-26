import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../images/sprite.component';
import { OpponentScoreComponent } from '../../opponent-overview/opponent-score/opponent-score.component';
import { NATURES } from '../../../assets/data';
import { FilterComponent } from '../../filter/filter.component';
import { Pokemon } from '../../interfaces/draft';

class PokemonBuilder {
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  } = {
    hp: 31,
    atk: 31,
    def: 31,
    spa: 31,
    spd: 31,
    spe: 31,
  };
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  } = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  gender: '' = '';
  level: number = 100;
  happiness = 255;
  hiddenpower: string = 'Dark';
  gmax: boolean = false;
  shiny: boolean = false;
  name: string = '';
  nature: string = '';
  moves: [string, string, string, string] = ['', '', '', ''];
  ability: string = '';
  item: string = '';
  tera: string = '';
  nickname: string = '';
  id: string = '';
  constructor() {}

  toPacked() {
    return [
      this.nickname,
      this.id,
      this.item,
      this.ability,
      this.moves.join(','),
      this.nature,
      Object.values(this.evs).join(','),
      this.gender,
      Object.values(this.ivs).join(','),
      this.shiny ? 'S' : '',
      this.level,
      [
        this.happiness,
        '',
        this.hiddenpower,
        this.gmax ? 'G' : '',
        '',
        this.tera,
      ].join(','),
    ].join('|');
  }

  toExport() {
    let string: string;
    if (this.nickname) {
      string = `${this.nickname} (${this.id})`;
    } else {
      string = `${this.id}`;
    }
    if (this.gender != '') string += ` (${this.gender})`;
    if (this.item != '') string += ` @ ${this.item}`;
    string += '\n';
    if (this.ability) string += `Ability: ${this.ability}\n`;
    if (this.level < 100 && this.level > 0) string += `Level: ${this.level}\n`;
    if (this.tera != '') string += `Tera Type: ${this.tera}\n`;
    let evs = Object.entries(this.evs)
      .filter((stat) => stat[1] <= 252 && stat[1] > 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (evs.length > 0) string += `EVs: ${evs.join(' / ')}\n`;
    if (this.nature != '') string += `${this.nature} Nature\n`;
    let ivs = Object.entries(this.ivs)
      .filter((stat) => stat[1] < 31 && stat[1] >= 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (ivs.length > 0) string += `IVs: ${ivs.join(' / ')}\n`;
    let moves = this.moves.filter((move) => move != '');
    moves.forEach((move) => {
      string += `- ${move}\n`;
    });
    return string;
  }
}

@Component({
  selector: 'teambuilder-analyzer',
  standalone: true,
  templateUrl: './teambuilder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    OpponentScoreComponent,
    FilterComponent,
  ],
})
export class TeamBuilderComponent implements OnInit {
  team: PokemonBuilder[] = [];
  natures = Object.values(NATURES);

  ngOnInit(): void {
    this.team.push(new PokemonBuilder());
  }

  nameSelected(pokemon: PokemonBuilder, event: Pokemon) {
    pokemon.id = event.id;
    pokemon.name = event.name;
    pokemon.shiny = event.shiny || false;
  }
}
