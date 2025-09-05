import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of } from 'rxjs';
import { League } from '../league-zone/league.interface';
import { getRandomPokemon } from '../data/namedex';
import { TeamPokemon } from '../league-zone/league-teams/league-team-card/league-team-card.component';
import { defenseData } from '../league-zone/league-ghost';
import { LeagueTierGroup } from '../league-zone/league-sign-up/league-sign-up.component';

const ROOTPATH = 'league';

@Injectable({
  providedIn: 'root',
})
export class LeagueZoneService {
  private apiService = inject(ApiService);

  getTeams() {
    return this.apiService.get(ROOTPATH, false);
  }

  getTeamDetail(teamIndex: number) {
    const team = defenseData[teamIndex];
    const roster: TeamPokemon[] = [];
    const pokemonCount = Math.round(Math.random() * 2) + 10;
    for (let i = 0; i < pokemonCount; i++) {
      const brought = Math.round(Math.random() * 8);
      const kills = Math.round(Math.random() * 20);
      const deaths = Math.round(Math.random() * 20);
      const tera = Math.round(Math.random() * 6) ? undefined : [];
      const z = Math.round(Math.random() * 6) ? undefined : [];
      const dmax = Math.round(Math.random() * 6) === 0;

      roster.push({
        ...getRandomPokemon(),
        tier: Math.round(Math.random() * 20),
        record: {
          brought,
          kills,
          deaths,
        },
        capt: {
          tera,
          z,
          dmax,
        },
      });
    }

    const wins = Math.round(Math.random() * 8);
    const diff = Math.round(Math.random() * 20) - 10;

    return of({
      ...team,
      roster,
      timezone: 'EST/EDT',
      record: {
        wins,
        losses: 8 - wins,
        diff,
      },
    });
  }

  getRules() {
    return of(this.rules);
  }

  getMatchups() {
    return of(this.matchups);
  }

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
  rules: League.Rule[] = [
    {
      title: 'Draft',
      body: `1. The draft is randomised and in a snake format (1-16, 16-1 etc.)
  2. Each coach must draft between 10 and 12 Pokemon with 120 points to spend.
  3. A coach does not need to spend their full budget and can end their draft after 10 picks
  4. Tera Captains will be decided after the 24 hour grace period following the draft.
  5. Drafting will begin on TBD with a 4 hour timer per pick between 8 am EST and 11PM EST. Timer Is halted between those hours, though picks can still come in.
  6. You may leave picks with a tournament organizer or someone who is behind you in the draft order.
  7. If a pick is skipped, the coach can make it later, but the timer for future picks will be halved each time a skip occurs. Leave picks with people so this doesn't happen to you.
      `,
    },
    {
      title: 'Terastalisation',
      body: `1. Teams will have 25 Tera Shards to spend on Tera Captains.
  2. Captaining a Pokemon costs the same amount of Tera Shards as the price you drafted it for in points.
  3. The amount of tera types a Tera Captain will have access to depends on its draft point tier:
    * 20-17 Point Pokemon → 0 Tera Types
    * 16-13 Point Pokemon → 1 Tera Types
    * 12-9 Point Pokemon → 2 Tera Types
    * 8-5 Point Pokemon → 3 Tera Types
    * 4-1 Point Pokemon → 4 Tera Types
  3. The following Pokemon Are Not allowed to Terastalize:
    * Baxcalibur
    * Kingambit
    * Melmetal
    * Necrozma
    * Ogerpon
    * Regieleki
    * Shedinja
    * Tapu Lele
    * Terapagos
    * Volcarona`,
    },
    {
      title: 'Z-Moves',
      body: `Z Moves are Not Allowed. Necrozma Ultra go home, you're drunk.`,
    },
    {
      title: 'Megas',
      body: `Megas and regular form pokemon are drafted seperately with coresponding point values.\n\nIf you draft a mega form, its held item MUST be it's mega stone. You can choose when/if you would like to mega it in battle, but your opponent will always know your item is the mega stone.\n\nIf you draft the regular pokemon - You cannot mega it it battle.`,
    },
    {
      title: 'Free Agency and Trades',
      body: `Teams will get 7 Transaction Points up until the end of Week 7. Free Agency, Tera Switch, and Coach to Coach trades all count towards this total.
  Coaches will be able to make trades before the draft ends. These trades do not count as transactions.
  A point is used for every pokemon you recieve from the trade.
  There will be a 24 hour grace period where each team will have unlimited Free Agency. Coaches can also trade with other coaches during this period. After the grace period has ended, coaches will declair their Tera Captains and corresponding types.
  If you drop a Tera Captain and want to Captain the Pokemon you pick up, It will only count as 1 trade, not 2.
  Changing Tera types on a pokemon may only be done once per season, using one of the 7 transactions.
  Transactions take effect the following week`,
    },
    {
      title: 'Discord and Scheduling',
      body: `1. All coaches must be in the DraftZone server for the duration of the tournament.
  2. All match scheduling must be made in the #scheduling channel in the DraftZone server.
  3. Extensions or rescheduling may be allowed in cases of serious, sudden issues and can be requested in #extension-request.
  4. Coaches with better communication may be awarded wins in case of unplayed games by TO discretion.`,
    },
    {
      title: 'Battles',
      body: `1. You will have 1 week to complete your (Gen9 NatDex Singles) best of 1 match for that week (Look at league schedule after the draft and plan ahead!)
  2. Every week will have a two day extension period that overlaps with the beginning of the next week. If the game is not played within the regular 7 day week, it MUST be played during this 2 day extension period.
  3. Serious sudden reasons for not playing can warrant further extensions or down the road rescheduling. If no date or time of battle is known to TO's by the end of the regular week, or the battle was not played at the time noted during the extension rule 4 will be referenced for the battle outcome.
  4. Forfeits will count as a 2-0 win/loss if done prior to the match beginning. Forfeiting during a match is strictly prohibited as it is poor sportsmanship.
  5. Battles will be played at Level 100, with all Pokemon being Level 100.
  6. Ghosting or coaching during battles is prohibited with a failure to comply being met with instant expulsion from the league
  7. You must bring 6 Pokemon to a battle.
  8. Battles will be played on showdown in the Gen9 NatDex Draft format. Check for team legality prior to playing!
  9. Sharing a player's team or build with their opponent is prohibited and will result in penalties, including voided games and bans.
  10. You can schedule and play your next weeks battle ahead of time, but do not talk about it or post results till that week please.
  11. If during a match, an illegal pokemon, move, tera type, or item is found to be used that does not adhere to "Gen 9 National Dex" rules or the draft board as defined by each players teams, the opposing coach can dictate if they would like the automatic 2-0 victory at that point, or if they would like to continue playing as normal with the error being dimissed and the outcome of the game playing out as normal.`,
    },
    {
      title: 'League Table and Playoffs',
      body: `1. Teams will play 8 teams through the regular season. Check the Schedule for who you play.
  2. Standings are determined in the following order: Game wins, Game differential, Head-to-head, Strength of schedule, Coin flip.
  3. Playoffs will consist of the top 8 coaches, with the highest seeds playing the lowest seeds first round.
  4. Scheduling During playoffs will follow the same 7 (+2) day week cycles for a total of 3 weeks.`,
    },
    {
      title: 'Battle Clauses & Bans',
      body: `1. The following Smogon clauses are in effect:
    - Sleep Clause (Multiple pokemon cannot be knowingly put to sleep)
    - Evasion Clause
    - OHKO Clause
    - Endless Battle Clause
  2. The following abilities are banned on all Pokémon:
    - Moody
    - Sand Veil
    - Snow Cloak
    - Arena Trap
    - Shadow Tag
    - Any illegal/unreleased abilities
  3. The following items are banned on all Pokémon:
    - Bright Powder
    - Lax Incense
    - King's Rock
    - Focus Band
    - Razor Fang
    - Quick Claw
    - Any illegal/unreleased items
  4. The following moves are banned on all Pokémon:
    - Hidden Powder
    - Last Respects
    - Shed Tail
    - Revival Blessing
    - Any illegal/unreleased moves
  5. Battles that go to timer will be decided by who went to timer, the losing coach will have their score lowered to 0 (eg. if the game ends 2-2 then the result will be a 2-0).
  6. Baton Pass cannot be used to pass stats or Substitute unless granted by the opponent.
  7. Species clause is active, so you may not draft multiple Pokemon that share a Pokedex number or a species.`,
    },
    {
      title: 'Complex Bans',
      body: `1. The following complex bans are in effect:
    - Zygarde-10% & 50% may not have the ability Power Construct.`,
    },
  ];

  signUp(signupData: object) {
    return this.apiService.post(`battlezone/pdbl/signup`, true, signupData);
  }

  getTiers(): Observable<LeagueTierGroup[]> {
    return this.apiService.get(`battlezone/pdbl/tiers`, false);
  }

  getDetails(): Observable<{
    format: string;
    ruleset: string;
    draft: [Date, Date];
    season: [Date, Date];
    prize: number;
  }> {
    return this.apiService.get(`battlezone/pdbl`, false);
  }
}
