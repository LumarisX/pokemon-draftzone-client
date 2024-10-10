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

    // Connect WebSocket
    this.webSocket.connect('teambuilder');
  }

  // Send a JSON-RPC request
  sendJsonRpcRequest(method: string, params: any) {
    console.log(method, params);
    const request = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.jsonRpcId++,
    };

    // Send the request and wait for the response with the same id
    this.webSocket.sendMessage(request).subscribe((response) => {
      console.log('Received response:', response);

      if (method === 'add') {
        this.team = response.team; // Assuming response has a team attribute
      }
    });
  }

  sendMessage() {
    // Example of sending a JSON-RPC request using the 'add' action
    this.sendJsonRpcRequest('add', {
      ruleset: this.selectedRuleset,
      format: this.selectedFormat,
      id: this.message,
    });
  }

  nameSelected(pokemon: PokemonBuilder, event: Pokemon) {
    pokemon.id = event.id;
    pokemon.name = event.name;
    pokemon.shiny = event.shiny || false;
  }
}
