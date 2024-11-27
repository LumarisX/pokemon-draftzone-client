import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../api/data.service';
import { WebSocketService } from '../../api/ws.service';
import { NATURES } from '../../data';
import { nameList } from '../../data/namedex';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { SelectNoSearchComponent } from '../../util/dropdowns/select/select-no-search.component';
import { SelectSearchComponent } from '../../util/dropdowns/select/select-search.component';
import { PokemonBuilder } from './pokemon-builder.model';

@Component({
  selector: 'teambuilder-analyzer',
  standalone: true,
  templateUrl: './teambuilder.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SpriteComponent,
    SelectSearchComponent,
    SelectNoSearchComponent,
  ],
})
export class TeamBuilderComponent implements OnInit {
  team: PokemonBuilder[] = [];
  natures = Object.entries(NATURES).map((nature) => ({
    name:
      nature[1].boost === nature[1].drop
        ? nature[1].name
        : `${
            nature[1].name
          } +${nature[1].boost.toUpperCase()}/-${nature[1].drop.toUpperCase()}`,
    value: nature[0],
  }));
  pokemon: Pokemon = { name: 'Clefable', id: 'clefable' };
  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';

  names: { name: string; value: Pokemon }[] = nameList();
  private jsonRpcId = 1;

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

  sendJsonRpcRequest(method: string, params: any) {
    console.log(method, params);
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.jsonRpcId++,
    };
    this.webSocket.sendMessage(request).subscribe((response) => {
      console.log('Received response:', response);
      if (method === 'add') {
        this.team = response.team.map(
          (e: Partial<PokemonBuilder> | undefined) => new PokemonBuilder(e)
        );
      } else if (method === 'update') {
        Object.assign(this.team[response.index], response.pokemon);
      }
    });
  }

  addPokemon() {
    this.sendJsonRpcRequest('add', {
      rulesetID: this.selectedRuleset,
      formatID: this.selectedFormat,
      id: this.pokemon.id,
    });
  }

  updateData(index: number, data: Partial<PokemonBuilder> = {}) {
    console.log('update', data);
    this.sendJsonRpcRequest('update', {
      index,
      data,
    });
  }

  nameSelected(pokemon: PokemonBuilder, event: Pokemon) {
    pokemon.id = event.id;
    pokemon.name = event.name;
    pokemon.shiny = event.shiny || false;
  }

  toValues(object: { name: string; id: string }[]) {
    return object.map((e) => ({ name: e.name, value: e.id }));
  }
}
