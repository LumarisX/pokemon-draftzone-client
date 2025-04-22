import { Component } from '@angular/core';
import { League } from '../league.interface';
import { MatchupCardComponent } from './matchup-card/matchup-card.component';

@Component({
  selector: 'pdz-league-schedule',
  imports: [MatchupCardComponent],
  templateUrl: './league-schedule.component.html',
  styleUrl: './league-schedule.component.scss',
})
export class LeagueScheduleComponent {
  matchups: League.Matchup[] = [
    {
      team1: {
        teamName: 'Deimos Deoxys',
        coach: 'Lumaris',
        score: 1,
        logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
      },
      team2: {
        teamName: 'Mighty Murkrow',
        coach: 'hsoj',
        score: 2,
        logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
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
    },
  ];
}
