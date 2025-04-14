import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-league-drafting',
  imports: [
    CommonModule,
    LeagueTierListComponent,
    SpriteComponent,
    MatIconModule,
  ],
  templateUrl: './league-drafting.component.html',
  styleUrls: ['./league-drafting.component.scss', '../league.scss'],
})
export class LeagueDraftingComponent {
  draftOrder: {
    teamName: string;
    status?: string;
    pokemon?: Pokemon;
  }[][] = [
    [
      {
        teamName: 'Mighty Murkrow',
        pokemon: { id: 'tapukoko', name: 'Tapu Koko' },
      },
      {
        teamName: 'Montreal Mean Mareanies',
        pokemon: { id: 'dragapult', name: 'Dragapult' },
      },
      {
        teamName: 'Philadelphia Flygons',
        pokemon: { id: 'latiosmega', name: 'Mega Latios' },
      },
      {
        teamName: 'London Vespiquens',
        pokemon: { id: 'ironvaliant', name: 'Iron Valiant' },
      },
      {
        teamName: 'Chicago White Fox',
        pokemon: { id: 'zamazenta', name: 'Zamazenta' },
      },
      {
        teamName: 'Victorious Vigoroths',
        pokemon: { id: 'landorustherian', name: 'Landorus-Therian' },
      },
      {
        teamName: 'Alpine Arcanines',
        pokemon: { id: 'tornadustherian', name: 'Tornadus-Therian' },
      },
      {
        teamName: 'Twinleaf Tatsugiri',
        pokemon: { id: 'tapulele', name: 'Tapu Lele' },
      },
      {
        teamName: 'Kalos Quagsires',
        pokemon: { id: 'urshifu', name: 'Urshifu-Single' },
      },
      {
        teamName: 'Tampa T-Chainz',
        pokemon: { id: 'chiyu', name: 'Chi-Yu' },
      },
      {
        teamName: `Fitchburg's Sun Chasers`,
        pokemon: { id: 'roaringmoon', name: 'Roaring Moon	' },
      },
      {
        teamName: 'Deep Sea Duskulls',
        pokemon: { id: 'gholdengo', name: 'Gholdengo' },
      },
      {
        teamName: `I like 'em THICC`,
        status: 'Skipped',
      },
      {
        teamName: `Midnight teddy's`,
        pokemon: { id: 'zeraora', name: 'Zeraora' },
      },
      {
        teamName: `Chicago Sky Attack`,
        pokemon: { id: 'zygarde', name: 'Zygarde' },
      },
      {
        teamName: `Deimos Deoxys`,
        pokemon: { id: 'archaludon', name: 'Archaludon' },
      },
    ],
    [
      {
        teamName: 'Mighty Murkrow',
      },
      {
        teamName: 'Montreal Mean Mareanies',
      },
      {
        teamName: 'Philadelphia Flygons',
      },
      {
        teamName: 'London Vespiquens',
      },
      {
        teamName: 'Chicago White Fox',
      },
      {
        teamName: 'Victorious Vigoroths',
      },
      {
        teamName: 'Alpine Arcanines',
      },
      {
        teamName: 'Twinleaf Tatsugiri',
      },
      {
        teamName: 'Kalos Quagsires',
      },
      {
        teamName: 'Tampa T-Chainz',
      },
      {
        teamName: `Fitchburg's Sun Chasers`,
      },
      {
        teamName: 'Deep Sea Duskulls',
        status: 'On Deck',
      },
      {
        teamName: `I like 'em THICC`,
        status: 'Picking',
      },
      {
        teamName: `Midnight teddy's`,
        pokemon: { id: 'infernape', name: 'Infernape' },
      },
      {
        teamName: `Chicago Sky Attack`,
        pokemon: { id: 'scizormega', name: 'Scizor-Mega' },
      },
      {
        teamName: `Deimos Deoxys`,
        pokemon: { id: 'pelipper', name: 'Pelipper' },
      },
    ],
  ];

  myTeamName = 'Deimos Deoxys';

  myDraft: { pokemon: Pokemon; cost: string }[] = [
    { pokemon: { name: 'Archaludon', id: 'archaludon' }, cost: '18' },
    { pokemon: { name: 'Pelipper', id: 'pelipper' }, cost: '11' },
    { pokemon: { name: 'Ninetales-Alola', id: 'ninetalesalola' }, cost: '10' },
    { pokemon: { name: 'Volcanion', id: 'volcanion' }, cost: '11' },
    { pokemon: { name: 'Kilowattrel', id: 'kilowattrel' }, cost: '11' },
    { pokemon: { name: 'Kartana', id: 'kartana' }, cost: '17' },
    { pokemon: { name: 'Swampert-Mega', id: 'swampertmega' }, cost: '12' },
    { pokemon: { name: 'Quaquaval', id: 'quaquaval' }, cost: '16' },
    { pokemon: { name: 'Claydol', id: 'claydol' }, cost: '3' },
    { pokemon: { name: 'Qwilfish-Hisui', id: 'qwilfishhisui' }, cost: '7' },
    { pokemon: { name: 'Beartic', id: 'beartic' }, cost: '3' },
    { pokemon: { name: 'Swirlix', id: 'swirlix' }, cost: '1' },
  ];

  constructor() {
    console.log(JSON.stringify(this.draftOrder[1].reverse()));
  }
}
