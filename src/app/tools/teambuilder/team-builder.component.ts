import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { WebSocketService } from '../../api/ws.service';
import { NATURES, Stat } from '../../data';
import { nameList } from '../../data/namedex';
import { FilterComponent } from '../../filter/filter.component';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { PokemonBuilder } from './pokemon-builder/pokemon-builder.model';

@Component({
  selector: 'team-builder',
  standalone: true,
  templateUrl: './team-builder.component.html',
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
export class TeamBuilderComponent implements OnInit {
  team: [
    PokemonBuilder | null,
    PokemonBuilder | null,
    PokemonBuilder | null,
    PokemonBuilder | null,
    PokemonBuilder | null,
    PokemonBuilder | null
  ] = [null, null, null, null, null, null];
  natures = Object.entries(NATURES).map((nature) => ({
    name:
      nature[1].boost === nature[1].drop
        ? nature[1].name
        : `${
            nature[1].name
          } +${nature[1].boost.toUpperCase()}/-${nature[1].drop.toUpperCase()}`,
    value: nature[0],
  }));

  pokemonList: { name: string; value: Pokemon }[] = nameList();
  pokemon: Pokemon = { name: 'Clefable', id: 'clefable' };
  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

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

  constructor(
    private webSocket: WebSocketService,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.dataService.getFormats().subscribe((formats) => {
      this.formats = formats;
    });

    this.dataService.getRulesets().subscribe((rulesets) => {
      this.rulesets = rulesets;
    });
    this.webSocket.connect('teambuilder');
  }

  addPokemon(data: Pokemon | null, index: number) {
    if (!data) {
      this.team[index] = null;
      return;
    }
    this.webSocket.sendJsonRpcRequest(
      'add',
      {
        rulesetID: this.selectedRuleset,
        formatID: this.selectedFormat,
        id: data.id,
      },
      (response: Record<number, Partial<PokemonBuilder>>) => {
        Object.entries(response).forEach(([i, e]) => {
          if (+i < this.team.length) {
            this.team[+i] = new PokemonBuilder(e);
          } else {
            this.team.push(new PokemonBuilder(e));
          }
        });

        // this.team = response.team.map(
        //   (e: Partial<PokemonBuilder> | undefined) => new PokemonBuilder(e)
        // );
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
        if (this.team[response.index]) {
          Object.assign(this.team[response.index]!, response.pokemon);
        } else {
          this.team[response.index] = response.pokemon;
        }
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
