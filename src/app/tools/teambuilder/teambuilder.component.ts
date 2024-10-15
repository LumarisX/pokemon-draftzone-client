import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SpriteComponent } from '../../images/sprite.component';
import { OpponentScoreComponent } from '../../opponent-overview/opponent-score/opponent-score.component';
import { NATURES } from '../../data';
import { FilterComponent } from '../../filter/filter.component';
import { Pokemon } from '../../interfaces/draft';
import { WebSocketService } from '../../api/ws.service';
import { DataService } from '../../api/data.service';
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
    OpponentScoreComponent,
    FilterComponent,
  ],
})
export class TeamBuilderComponent implements OnInit {
  team: PokemonBuilder[] = [];
  natures = Object.values(NATURES);
  message: string = '';
  formats: string[] = [];
  rulesets: string[] = [];
  selectedFormat: string = 'Singles';
  selectedRuleset: string = 'Gen9 NatDex';
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
        this.team = response.team;
      } else if (method === 'update') {
        this.team[response.index] = response.pokemon;
      }
    });
  }

  addPokemon() {
    this.sendJsonRpcRequest('add', {
      rulesetID: this.selectedRuleset,
      formatID: this.selectedFormat,
      id: this.message,
    });
  }

  updateData(index: number) {
    this.sendJsonRpcRequest('update', {
      index: index,
      data: this.team[index],
    });
  }

  nameSelected(pokemon: PokemonBuilder, event: Pokemon) {
    pokemon.id = event.id;
    pokemon.name = event.name;
    pokemon.shiny = event.shiny || false;
  }
}
