import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { WebSocketService } from '../../../api/ws.service';
import { NATURES, Stat } from '../../../data';
import { nameList } from '../../../data/namedex';
import { FilterComponent } from '../../../filter/filter.component';
import { SpriteComponent } from '../../../images/sprite.component';
import { Pokemon } from '../../../interfaces/draft';
import { SelectNoSearchComponent } from '../../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../../util/dropdowns/select/select-search.component';
import { PokemonBuilder } from './pokemon-builder.model';

@Component({
  selector: 'pokemon-builder',
  standalone: true,
  templateUrl: './pokemon-builder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    FilterComponent,
    SelectSearchComponent,
    SelectNoSearchComponent,
  ],
})
export class PokemonBuilderComponent implements OnInit {
  pokemonbuilder: PokemonBuilder;
  natures = Object.entries(NATURES).map((nature) => ({
    name:
      nature[1].boost === nature[1].drop
        ? nature[1].name
        : `${
            nature[1].name
          } +${nature[1].boost.toUpperCase()}/-${nature[1].drop.toUpperCase()}`,
    value: nature[0],
  }));

  private _pokemon: Pokemon = { name: 'Clefable', id: 'clefable' };

  @Input()
  set pokemon(value: Pokemon) {
    this._pokemon = value;
    this.webSocket.sendJsonRpcRequest(
      'add',
      {
        rulesetID: this.ruleset,
        formatID: this.format,
        id: this.pokemon.id,
      },
      (response) => {
        this.pokemonbuilder = new PokemonBuilder(response);
      }
    );
  }

  get pokemon() {
    return this._pokemon;
  }
  format: string = 'Singles';
  ruleset: string = 'Gen9 NatDex';

  names: { name: string; value: Pokemon }[] = nameList();

  // Tabs setup
  tabs = ['General', 'Moves', 'Stats', 'Export'];
  activeTab = 'General';

  stats: { label: string; key: Stat }[] = [
    { label: 'HP', key: 'hp' },
    { label: 'ATK', key: 'atk' },
    { label: 'DEF', key: 'def' },
    { label: 'SPA', key: 'spa' },
    { label: 'SPD', key: 'spd' },
    { label: 'SPE', key: 'spe' },
  ];

  constructor(private webSocket: WebSocketService) {}

  ngOnInit(): void {
    this.webSocket.connect('teambuilder');
  }

  addPokemon() {
    this.webSocket.sendJsonRpcRequest(
      'add',
      {
        rulesetID: this.ruleset,
        formatID: this.format,
        id: this.pokemon.id,
      },
      (response) => {
        this.team = response.team.map(
          (e: Partial<PokemonBuilder> | undefined) => new PokemonBuilder(e)
        );
      }
    );
  }

  updateData(index: number, data: Partial<PokemonBuilder> = {}) {
    console.log('update', data);
    this.webSocket.sendJsonRpcRequest(
      'update',
      {
        index,
        data,
      },
      (response) => {
        Object.assign(this.team[response.index], response.pokemon);
      }
    );
  }

  toValues(object: { name: string; id: string }[]) {
    return object.map((e) => ({ name: e.name, value: e.id }));
  }

  getTabClass(tab: string) {
    return this.activeTab === tab
      ? 'border-b-2 border-blue-500 font-semibold'
      : 'text-gray-500';
  }
}
