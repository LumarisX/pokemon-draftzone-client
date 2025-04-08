import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { LeagueTierListComponent } from '../league-tier-list/league-tier-list.component';

@Component({
  selector: 'app-league',
  imports: [LeagueTierListComponent, SpriteComponent, MatIconModule],
  templateUrl: './league.component.html',
  styleUrl: './league.component.scss',
})
export class LeagueComponent {
  picks: {
    teamName: string;
    picker?: string;
    pokemon?: Pokemon;
  }[] = [
    {
      teamName: 'Mighty Murkrow',
      picker: 'hsoj',
      pokemon: { id: 'tapukoko', name: 'Tapu Koko' },
    },
    {
      teamName: 'Montreal Mean Mareanies',
      picker: 'Qofol',
      pokemon: { id: 'dragapult', name: 'Dragapult' },
    },
    {
      teamName: 'Philadelphia Flygons',
      picker: '02ThatOneGuy',
      pokemon: { id: 'latiosmega', name: 'Mega Latios' },
    },
    {
      teamName: 'London Vespiquens',
      picker: 'Jake W',
      pokemon: { id: 'ironvaliant', name: 'Iron Valiant' },
    },
    {
      teamName: 'Chicago White Fox',
      picker: 'TheNotoriousABS',
      pokemon: { id: 'zamazenta', name: 'Zamazenta' },
    },
  ];

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
}
