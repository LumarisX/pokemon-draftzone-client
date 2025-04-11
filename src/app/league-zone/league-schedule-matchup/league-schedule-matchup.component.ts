import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Pokemon } from '../../interfaces/draft';
import { CommonModule } from '@angular/common';
import { SpriteComponent } from '../../images/sprite/sprite.component';

type MatchTeam = {
  teamName: string;
  coachName: string;
  score: number;
};

type MatchPokemon = Pokemon & {
  status?: 'brought' | 'fainted';
};

@Component({
  selector: 'app-league-schedule-matchup',
  imports: [CommonModule, MatIconModule, SpriteComponent],
  templateUrl: './league-schedule-matchup.component.html',
  styleUrl: './league-schedule-matchup.component.scss',
})
export class LeagueScheduleMatchupComponent {
  matchup: {
    team1: MatchTeam;
    team2: MatchTeam;
    matches: {
      link: string;
      team1: { team: MatchPokemon[]; score: number };
      team2: { team: MatchPokemon[]; score: number };
    }[];
  } = {
    team1: {
      teamName: 'Deimos Deoxys',
      coachName: 'Lumaris',
      score: 1,
    },
    team2: {
      teamName: 'Mighty Murkrow',
      coachName: 'hsoj',
      score: 2,
    },
    matches: [
      {
        link: 'test',
        team1: {
          score: 1,
          team: [
            {
              id: 'pelipper',
              name: 'Pelipper',
              status: 'fainted',
            },
            {
              id: 'archaludon',
              name: 'Archaludon',
              status: 'brought',
            },
            {
              id: 'swampertmega',
              name: 'Swampert-Mega',
              status: 'fainted',
            },
            {
              id: 'quaquaval',
              name: 'Quaquaval',
              status: 'fainted',
            },
            {
              id: 'claydol',
              name: 'Claydol',
            },
            {
              id: 'qwilfishhisui',
              name: 'Qwilfish-Hisui',
            },
          ],
        },
        team2: {
          score: 0,
          team: [
            {
              id: 'tapukoko',
              name: 'Tapu Koko',
              status: 'fainted',
            },
            {
              id: 'ironleaves',
              name: 'Iron Leaves',
            },
            {
              id: 'ironjugulis',
              name: 'Iron Jugulis',
              status: 'fainted',
            },
            {
              id: 'terapagosterastal',
              name: 'Terapagos-Terastal',
              status: 'fainted',
            },
            {
              id: 'clodsire',
              name: 'Clodsire',
              status: 'fainted',
            },
            {
              id: 'shedinja',
              name: 'Shedinja',
            },
          ],
        },
      },
      {
        link: '',
        team1: {
          score: 0,
          team: [
            {
              id: 'pelipper',
              name: 'Pelipper',
              status: 'fainted',
            },
            {
              id: 'archaludon',
              name: 'Archaludon',
              status: 'fainted',
            },
            {
              id: 'swampertmega',
              name: 'Swampert-Mega',
            },
            {
              id: 'quaquaval',
              name: 'Quaquaval',
              status: 'fainted',
            },
            {
              id: 'claydol',
              name: 'Claydol',
            },
            {
              id: 'qwilfishhisui',
              name: 'Qwilfish-Hisui',
              status: 'fainted',
            },
          ],
        },
        team2: {
          score: 1,
          team: [
            {
              id: 'tapukoko',
              name: 'Tapu Koko',
              status: 'fainted',
            },
            {
              id: 'ironleaves',
              name: 'Iron Leaves',
              status: 'fainted',
            },
            {
              id: 'ironjugulis',
              name: 'Iron Jugulis',
              status: 'fainted',
            },
            {
              id: 'terapagosterastal',
              name: 'Terapagos-Terastal',
            },
            {
              id: 'clodsire',
              name: 'Clodsire',
              status: 'brought',
            },
            {
              id: 'shedinja',
              name: 'Shedinja',
            },
          ],
        },
      },
      {
        link: '',
        team1: {
          score: 0,
          team: [
            {
              id: 'pelipper',
              name: 'Pelipper',
              status: 'fainted',
            },
            {
              id: 'archaludon',
              name: 'Archaludon',
              status: 'fainted',
            },
            {
              id: 'swampertmega',
              name: 'Swampert-Mega',
              status: 'fainted',
            },
            {
              id: 'quaquaval',
              name: 'Quaquaval',
            },
            {
              id: 'claydol',
              name: 'Claydol',
              status: 'fainted',
            },
            {
              id: 'qwilfishhisui',
              name: 'Qwilfish-Hisui',
            },
          ],
        },
        team2: {
          score: 2,
          team: [
            {
              id: 'tapukoko',
              name: 'Tapu Koko',
              status: 'fainted',
            },
            {
              id: 'ironleaves',
              name: 'Iron Leaves',
            },
            {
              id: 'ironjugulis',
              name: 'Iron Jugulis',
            },
            {
              id: 'terapagosterastal',
              name: 'Terapagos-Terastal',
              status: 'fainted',
            },
            {
              id: 'clodsire',
              name: 'Clodsire',
              status: 'fainted',
            },
            {
              id: 'shedinja',
              name: 'Shedinja',
              status: 'brought',
            },
          ],
        },
      },
    ],
  };
  selectedMatch: number = 0;
  cardOpen: boolean = false;
}
