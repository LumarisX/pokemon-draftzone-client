import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';

interface RuleList {
  text?: string;
  list?: string[];
}

interface RuleCategory {
  title: string;
  description: (string | RuleList)[];
}

@Component({
  selector: `bz-rules`,
  templateUrl: `./rules.component.html`,
  standalone: true,
  styleUrl: `./rules.component.scss`,
  imports: [CommonModule, MatButtonModule, MatExpansionModule, RouterModule],
})
export class BZRulesComponent {
  private leagueSettings = {
    points: 65,
    draftCount: [10, 12],
    graceHours: 24,
    timerHours: 4,
    teraShards: 15,
    tradeTransactions: 7,
    extensionDays: 2,
    clauses: [
      `Sleep Clause (Multiple Pokémon cannot be knowingly put to sleep)`,
      `Evasion Clause`,
      `OHKO Clause`,
      `Endless Battle Clause`,
    ],
    banned: {
      tera: [`Shedinja`],
      abilities: [
        `Moody`,
        `Sand Veil`,
        `Snow Cloak`,
        `Arena Trap`,
        `Shadow Tag`,
        `Any illegal/unreleased abilities`,
      ],
      items: [
        `Bright Powder`,
        `Lax Incense`,
        `King's Rock`,
        `Focus Band`,
        `Razor Fang`,
        `Quick Claw`,
        `Smooth Rock`,
        `Icy Rock`,
        `Heat Rock`,
        `Damp Rock`,
        `Terrain Extender`,
        `Light Clay`,
        `Any illegal/unreleased items`,
      ],
      moves: [
        `Hidden Powder`,
        `Last Respects`,
        `Shed Tail`,
        `Revival Blessing`,
        `Any illegal/unreleased moves`,
      ],
      complex: [
        {
          text: `The following complex bans are in effect:`,
          list: [`Zygarde-10% may not have the ability Power Construct.`],
        },
      ],
    },
  };

  public readonly leagueRules: RuleCategory[] = [
    {
      title: `Draft`,
      description: [
        `The draft is randomised and in a snake format (1-16, 16-1 etc.)`,
        `Each coach must draft between ${this.leagueSettings.draftCount[0]} and ${this.leagueSettings.draftCount[this.leagueSettings.draftCount.length - 1]} Pokémon with ${this.leagueSettings.points} to spend.`,
        `A coach does not need to spend their full budget and can end their draft after ${this.leagueSettings.draftCount[0]} picks`,
        `Tera Captains will be decided after the ${this.leagueSettings.graceHours} hour grace period following the draft.`,
        `Drafting will begin on TBD with a ${this.leagueSettings.timerHours} hour timer per pick between 8AM EST and 11PM EST. The timer is halted between those hours, though picks can still come in.`,
        `You may leave picks with a tournament organizer or someone who is behind you in the draft order.`,
        `If a pick is skipped, the coach can make it later, but the timer for future picks will be halved each time a skip occurs. Leave picks with people so this doesn't happen to you.`,
      ],
    },
    {
      title: `Terastalisation`,
      description: [
        `Teams will have ${this.leagueSettings.teraShards} Tera Shards to spend on Tera Captains.`,
        `Captaining a Pokémon costs the same amount of Tera Shards as the price you drafted it for in points.`,
        {
          text: `The amount of tera types a Tera Captain will have access to depends on its draft point tier:`,
          list: [
            `12-10 Point Pokémon → 0 Tera Types`,
            `9-7 Point Pokémon → 1 Tera Types`,
            `6-4 Point Pokémon → 2 Tera Types`,
            `3-1 Point Pokémon → 3 Tera Types`,
          ],
        },
        {
          text: `The following Pokémon are not allowed to Terastalize:`,
          list: this.leagueSettings.banned.tera,
        },
      ],
    },
    {
      title: `Z-Moves`,
      description: [
        `Z Moves are Not Allowed. Necrozma Ultra go home, you're drunk.`,
      ],
    },
    {
      title: `Megas`,
      description: [
        `Megas and regular form Pokémon are drafted separately with corresponding point values.`,
        'If you draft a mega form, its held item MUST be its mega stone. You can choose when/if you would like to mega it in battle, but your opponent will always know your item is the mega stone.',
        `If you draft the regular Pokémon - You cannot mega it in battle.`,
      ],
    },
    {
      title: `Free Agency and Trades`,
      description: [
        `Teams will get ${this.leagueSettings.tradeTransactions} Transaction Points up until the end of Week 7. Free Agency, Tera Switch, and Coach to Coach trades all count towards this total.`,
        `Coaches will be able to make trades before the draft ends. These trades do not count as transactions.`,
        `A point is used for every Pokémon you recieve from the trade.`,
        `There will be a ${this.leagueSettings.graceHours} hour grace period where each team will have unlimited Free Agency. Coaches can also trade with other coaches during this period. After the grace period has ended, coaches will declair their Tera Captains and corresponding types.`,
        `If you drop a Tera Captain and want to captain the Pokémon you pick up, it will only count as 1 trade, not 2.`,
        `Changing Tera types on a Pokémon may only be done once per season, using one of the ${this.leagueSettings.tradeTransactions} transactions.`,
        `Transactions take effect the following week.`,
      ],
    },
    {
      title: `Discord and Scheduling`,
      description: [
        `All coaches must be in the DraftZone server for the duration of the tournament.`,
        `All match scheduling must be made in the #scheduling channel in the DraftZone server.`,
        `Extensions or rescheduling may be allowed in cases of serious, sudden issues and can be requested in #extension-request.`,
        `Coaches with better communication may be awarded wins in case of unplayed games by TO discretion.`,
      ],
    },
    {
      title: `Battles`,
      description: [
        `You will have 1 week to complete your (Gen9 NatDex Singles) best of 1 match for that week (Look at league schedule after the draft and plan ahead!)`,
        `Every week will have a ${this.leagueSettings.extensionDays} day extension period that overlaps with the beginning of the next week. If the game is not played within the regular 7 day week, it MUST be played during this ${this.leagueSettings.extensionDays} day extension period.`,
        'Serious sudden reasons for not playing can warrant further extensions or down the road rescheduling. If no date or time of battle is known to TO`s by the end of the regular week, or the battle was not played at the time noted during the extension rule 4 will be referenced for the battle outcome.',
        `Forfeits will count as a 2-0 win/loss if done prior to the match beginning. Forfeiting during a match is strictly prohibited as it is poor sportsmanship.`,
        `If a coach's team is incorrect due to an organizational error at the time of the match, the opponent may decide to continue or get an automatic extension to replay the match with the fixed error.`,
        `Battles will be played at Level 100, with all Pokémon being Level 100.`,
        `Ghosting or coaching during battles is prohibited with a failure to comply being met with instant expulsion from the league`,
        `You must bring 6 Pokémon to a battle.`,
        `Battles will be played on showdown in the Gen9 NatDex Draft format. Check for team legality prior to playing!`,
        'Sharing a player`s team or build with their opponent is prohibited and will result in penalties, including voided games and bans.',
        `You can schedule and play your next weeks battle ahead of time, but do not talk about it or post results till that week please.`,
        `If during a match, an illegal Pokémon, move, tera type, or item is found to be used that does not adhere to "Gen 9 National Dex" rules or the draft board as defined by each players teams, the opposing coach can dictate if they would like the automatic 2-0 victory at that point, or if they would like to continue playing as normal with the error being dimissed and the outcome of the game playing out as normal.`,
      ],
    },
    {
      title: `League Table and Playoffs`,
      description: [
        `Teams will play 8 teams through the regular season. Check the Schedule for who you play.`,
        `Standings are determined in the following order: Game wins, Game differential, Head-to-head, Strength of schedule, Coin flip.`,
        `Playoffs will consist of the top 8 coaches, with the highest seeds playing the lowest seeds first round.`,
        `Scheduling During playoffs will follow the same 7 (+2) day week cycles for a total of 3 weeks.`,
      ],
    },
    {
      title: `Battle Clauses & Bans`,
      description: [
        {
          text: `The following Smogon clauses are in effect:`,
          list: this.leagueSettings.clauses,
        },
        {
          text: `The following abilities are banned on all Pokémon:`,
          list: this.leagueSettings.banned.abilities,
        },
        {
          text: `The following items are banned on all Pokémon:`,
          list: this.leagueSettings.banned.items,
        },
        {
          text: `The following moves are banned on all Pokémon:`,
          list: this.leagueSettings.banned.moves,
        },
        `Any team containing illegal move, item, or Pokémon will be considered a loss for that coach unless the tournament organizers otherwise, like in the instance it has no affect on the battle.`,
        `Battles that go to timer will be decided by who went to timer, the losing coach will have their score lowered to 0 (eg. if the game ends 2-2 then the result will be a 2-0).`,
        `Baton Pass cannot be used to pass stats or Substitute unless granted by the opponent.`,
        `Species clause is active, so you may not draft multiple Pokémon that share a Pokedex number or a species.`,
      ],
    },
    {
      title: `Complex Bans`,
      description: this.leagueSettings.banned.complex,
    },
    {
      title: `Other`,
      description: [
        `The tournament organizers' reserve the right to add or define any of the rules to improve the health and enjoyment of the league`,
      ],
    },
  ];

  constructor() {}

  isRuleString(rule: string | RuleList): rule is string {
    return typeof rule === `string`;
  }

  isRuleList(rule: string | RuleList): rule is RuleList {
    return typeof rule !== `string`;
  }
}
