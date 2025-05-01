import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LeagueSingleElimBracketComponent } from './league-single-elim-bracket/league-single-elim-bracket.component';

@Component({
  selector: 'pdz-league-bracket',
  imports: [CommonModule, LeagueSingleElimBracketComponent],
  templateUrl: './league-bracket.component.html',
  styleUrl: './league-bracket.component.scss',
})
export class LeagueBracketComponent {
  rounds: {
    title: string;
    matches: {
      team1: {
        teamName: string;
        coachName: string;
        score: number;
        seed: number;
        logo: string;
      };
      team2: {
        teamName: string;
        coachName: string;
        score: number;
        seed: number;
        logo: string;
      };
    }[];
  }[] = [
    {
      title: 'Round 1',
      matches: [
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
      ],
    },
    {
      title: 'Round 2',
      matches: [
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
      ],
    },
    {
      title: 'Round 3',
      matches: [
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
      ],
    },
    {
      title: 'Round 4',
      matches: [
        {
          team1: {
            teamName: 'Deimos Deoxys',
            coachName: 'Lumaris',
            score: 0,
            seed: 1,
            logo: './assets/images/DeimosDeoxys.png',
          },
          team2: {
            teamName: 'Mighty Murkrow',
            coachName: 'hsoj',
            score: 0,
            seed: 2,
            logo: './assets/images/MightyMurkrows.png',
          },
        },
      ],
    },
  ];
}
